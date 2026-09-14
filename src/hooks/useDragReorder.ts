import { CSSProperties, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react';

export type DropSide = 'before' | 'after' | null;

export interface UseDragReorderOptions {
  /** Fires once, on pointerup, when the drag ends over a valid, different target. */
  onDrop: (fromKey: string, toKey: string) => void;
  canDrag: (key: string) => boolean;
  canDrop: (key: string) => boolean;
  /** Pixels of pointer movement before a pointerdown becomes a drag. */
  threshold?: number;
}

export interface DragHandleProps {
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void;
  style: CSSProperties;
}

export interface UseDragReorderResult {
  draggingKey: string | null;
  overKey: string | null;
  dropSide: DropSide;
  getHandleProps: (key: string) => DragHandleProps;
  getTargetProps: (key: string) => { 'data-drag-key': string };
  /** True from the moment a drag starts until the next pointerdown on a handle — lets a
   * click handler that fires right after the drop (real browsers dispatch click after
   * pointerup regardless of movement) skip acting on it. */
  wasDragged: () => boolean;
}

const DRAG_KEY_ATTR = 'data-drag-key';

/**
 * Pointer-events drag reorder shared by the column chooser rows and the table header row.
 * `setPointerCapture` redirects every subsequent pointer event for this pointer to the
 * handle itself, so `pointermove`/`pointerup` are wired on the handle (not `document`) and
 * still fire even once the pointer has left it — but that also means `pointerenter` on the
 * hovered target never fires, so the target under the pointer is found on every move via
 * `elementFromPoint` + `data-drag-key` instead.
 */
export function useDragReorder({
  onDrop,
  canDrag,
  canDrop,
  threshold = 5,
}: UseDragReorderOptions): UseDragReorderResult {
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const [dropSide, setDropSide] = useState<DropSide>(null);

  const pointerIdRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const sourceKeyRef = useRef<string | null>(null);
  const sourceElRef = useRef<Element | null>(null);
  const isDraggingRef = useRef(false);
  const overKeyRef = useRef<string | null>(null);
  const dropSideRef = useRef<DropSide>(null);
  const wasDraggedRef = useRef(false);

  const reset = useCallback(() => {
    pointerIdRef.current = null;
    startRef.current = null;
    sourceKeyRef.current = null;
    sourceElRef.current = null;
    isDraggingRef.current = false;
    overKeyRef.current = null;
    dropSideRef.current = null;
    setDraggingKey(null);
    setOverKey(null);
    setDropSide(null);
  }, []);

  const updateTarget = useCallback(
    (clientX: number, clientY: number) => {
      const sourceKey = sourceKeyRef.current;
      const sourceEl = sourceElRef.current;
      if (!sourceKey) return;

      const hit = document.elementFromPoint(clientX, clientY)?.closest(`[${DRAG_KEY_ATTR}]`) ?? null;
      const key = hit?.getAttribute(DRAG_KEY_ATTR) ?? null;

      if (!key || key === sourceKey || !canDrop(key)) {
        overKeyRef.current = null;
        dropSideRef.current = null;
        setOverKey(null);
        setDropSide(null);
        return;
      }

      const side: DropSide =
        sourceEl && hit && sourceEl.compareDocumentPosition(hit) & Node.DOCUMENT_POSITION_FOLLOWING
          ? 'after'
          : 'before';

      overKeyRef.current = key;
      dropSideRef.current = side;
      setOverKey(key);
      setDropSide(side);
    },
    [canDrop]
  );

  useEffect(() => {
    if (!draggingKey) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') reset();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [draggingKey, reset]);

  const getHandleProps = useCallback(
    (key: string): DragHandleProps => {
      const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
        if (!canDrag(key) || pointerIdRef.current !== null) return;
        wasDraggedRef.current = false;
        pointerIdRef.current = e.pointerId;
        startRef.current = { x: e.clientX, y: e.clientY };
        sourceKeyRef.current = key;
        sourceElRef.current = e.currentTarget.closest(`[${DRAG_KEY_ATTR}]`) ?? e.currentTarget;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      };

      const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
        if (pointerIdRef.current !== e.pointerId || sourceKeyRef.current !== key) return;
        const start = startRef.current;
        if (!start) return;

        if (!isDraggingRef.current) {
          const dx = e.clientX - start.x;
          const dy = e.clientY - start.y;
          if (Math.hypot(dx, dy) < threshold) return;
          isDraggingRef.current = true;
          wasDraggedRef.current = true;
          setDraggingKey(key);
        }
        updateTarget(e.clientX, e.clientY);
      };

      const onPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
        if (pointerIdRef.current !== e.pointerId || sourceKeyRef.current !== key) return;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        const target = overKeyRef.current;
        if (isDraggingRef.current && target && target !== key && canDrop(target)) {
          onDrop(key, target);
        }
        reset();
      };

      const onPointerCancel = (e: ReactPointerEvent<HTMLElement>) => {
        if (pointerIdRef.current !== e.pointerId || sourceKeyRef.current !== key) return;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        reset();
      };

      return {
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        style: { touchAction: 'none' },
      };
    },
    [canDrag, canDrop, onDrop, reset, threshold, updateTarget]
  );

  const getTargetProps = useCallback(
    (key: string) => ({ [DRAG_KEY_ATTR]: key }),
    []
  );

  const wasDragged = useCallback(() => wasDraggedRef.current, []);

  return { draggingKey, overKey, dropSide, getHandleProps, getTargetProps, wasDragged };
}
