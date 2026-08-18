import type { LocBox, PageHitMap } from './hit-map';

/**
 * Transparent hit-test layer over one rendered PDF page. Boxes come sorted
 * largest-first, so later (smaller) siblings sit on top and win hover/click —
 * pointing at nested content selects the innermost element.
 */
export function InspectOverlay({
  map,
  cssWidth,
  selectedLoc,
  onSelect,
}: {
  map: PageHitMap;
  cssWidth: number;
  selectedLoc: string | null;
  onSelect: (box: LocBox) => void;
}) {
  const scale = cssWidth / map.width;
  return (
    <div className="absolute inset-0 z-10 cursor-crosshair">
      {map.boxes.map((box) => (
        <button
          key={`${box.loc}@${box.x},${box.y}`}
          type="button"
          aria-label={`Inspect ${box.tag} at ${box.loc}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(box);
          }}
          className={
            'absolute rounded-[2px] border transition-colors ' +
            (selectedLoc === box.loc
              ? 'border-blue-500 bg-blue-500/15'
              : 'border-transparent hover:border-blue-400/80 hover:bg-blue-400/10')
          }
          style={{
            left: (box.x - 2) * scale,
            top: (box.y - 2) * scale,
            width: (box.w + 4) * scale,
            height: (box.h + 4) * scale,
          }}
        />
      ))}
    </div>
  );
}
