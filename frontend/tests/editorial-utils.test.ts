import test from "node:test";
import assert from "node:assert/strict";

const {
  buildEditorialMapHref,
  resolveFeedFilterFromFocus,
  shouldRenderEditorialAddress,
} = await import(new URL("../lib/utils/editorial.ts", import.meta.url).href);

test("resolveFeedFilterFromFocus prioritizes explicit focus filters", () => {
  assert.equal(resolveFeedFilterFromFocus("person", "all"), "person");
  assert.equal(resolveFeedFilterFromFocus("place", "event"), "place");
  assert.equal(resolveFeedFilterFromFocus("event", "all"), "event");
});

test("resolveFeedFilterFromFocus resets the main feed to all", () => {
  assert.equal(resolveFeedFilterFromFocus("feed", "person"), "all");
  assert.equal(resolveFeedFilterFromFocus("feed", "all"), "all");
});

test("buildEditorialMapHref encodes the editorial identifier", () => {
  assert.equal(buildEditorialMapHref("place-wurth"), "/map?editorial=place-wurth");
  assert.equal(
    buildEditorialMapHref("place wurth/1", "/website"),
    "/website/map?editorial=place%20wurth%2F1"
  );
});

test("shouldRenderEditorialAddress avoids duplicate subtitle/address output", () => {
  assert.equal(
    shouldRenderEditorialAddress("1 Rue du Bain aux Plantes, Strasbourg", "1 Rue du Bain aux Plantes, Strasbourg"),
    false
  );
  assert.equal(
    shouldRenderEditorialAddress("1 Rue du Bain aux Plantes, Strasbourg", "Musee Wurth | Erstein"),
    true
  );
  assert.equal(shouldRenderEditorialAddress(undefined, "Musee Wurth | Erstein"), false);
});
