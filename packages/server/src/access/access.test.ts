import { describe, expect, it } from "vitest";
import { createAccessGate, readAccessKeys } from "@/access/access";

describe("readAccessKeys", () => {
  it("splits a comma separated list", () => {
    expect(readAccessKeys("one, two ,three")).toEqual(["one", "two", "three"]);
  });

  it("drops blanks and treats an unset value as no keys", () => {
    expect(readAccessKeys("one,,  ,two")).toEqual(["one", "two"]);
    expect(readAccessKeys("")).toEqual([]);
    expect(readAccessKeys(undefined)).toEqual([]);
  });
});

describe("createAccessGate", () => {
  it("lets everyone through when no key is issued", () => {
    const gate = createAccessGate([]);

    expect(gate.required).toEqual(false);
    expect(gate.allows(undefined)).toEqual(true);
    expect(gate.allows("anything")).toEqual(true);
  });

  it("admits any issued key and refuses the rest", () => {
    const gate = createAccessGate(["press-start", "second-key"]);

    expect(gate.required).toEqual(true);
    expect(gate.allows("press-start")).toEqual(true);
    expect(gate.allows("SECOND-KEY")).toEqual(true);
    expect(gate.allows("guess")).toEqual(false);
    expect(gate.allows(undefined)).toEqual(false);
    expect(gate.allows("")).toEqual(false);
  });
});
