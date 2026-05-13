/**
 * Pre-seeds radial positions so nodes start in their correct rings
 * instead of collapsing to center before the simulation stabilizes.
 *
 * Tier 0 = hub (fixed at center)
 * Tier 1 = category ring at R1
 * Tier 2 = service ring at R2, grouped by category
 */
export const RADII = { 0: 0, 1: 220, 2: 420 };

export function seedPositions(nodes, cx, cy) {
  // Group category nodes
  const categoryNodes = nodes.filter(n => n.tier === 1);
  const serviceNodes  = nodes.filter(n => n.tier === 2);

  // Fix hub at center
  const hub = nodes.find(n => n.tier === 0);
  if (hub) {
    hub.fx = cx;
    hub.fy = cy;
    hub.x  = cx;
    hub.y  = cy;
  }

  // Distribute categories evenly around ring 1
  categoryNodes.forEach((cat, i) => {
    const angle = (2 * Math.PI * i) / categoryNodes.length - Math.PI / 2;
    cat.x = cx + RADII[1] * Math.cos(angle);
    cat.y = cy + RADII[1] * Math.sin(angle);
    cat._angle = angle;
  });

  // Distribute services around ring 2, grouped near their category angle
  const catAngleMap = new Map(categoryNodes.map(c => [c.id, c._angle]));
  const catServiceMap = new Map();
  serviceNodes.forEach(svc => {
    if (!catServiceMap.has(svc.categoryId)) catServiceMap.set(svc.categoryId, []);
    catServiceMap.get(svc.categoryId).push(svc);
  });

  catServiceMap.forEach((svcs, catId) => {
    const baseAngle = catAngleMap.get(catId) ?? 0;
    const spread = (2 * Math.PI) / categoryNodes.length * 0.85;
    svcs.forEach((svc, i) => {
      const offset = svcs.length === 1
        ? 0
        : (i / (svcs.length - 1) - 0.5) * spread;
      const angle = baseAngle + offset;
      svc.x = cx + RADII[2] * Math.cos(angle);
      svc.y = cy + RADII[2] * Math.sin(angle);
    });
  });
}
