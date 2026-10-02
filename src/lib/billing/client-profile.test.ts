import { describe, expect, it } from "vitest";

import { requireCountryContext } from "@/countries";
import { FORM_LOADERS } from "@/templates/registry/forms";
import { resolveDefaultConfig } from "@/templates/types";

import { applyClientProfile, type ClientProfile } from "./client-profile";

const profile: ClientProfile = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Ferretería El Martillo",
  rtn: "08011999123456",
  address: "Barrio Abajo, Tegucigalpa",
  phone: "",
  email: null,
  logo: null,
  branding: { color: "#1F4E79" },
};

describe("applyClientProfile", () => {
  it("llena los campos con profileKey y respeta lo que el perfil no tiene", async () => {
    const form = await FORM_LOADERS["factura-con-isv"]!();
    const defaults = resolveDefaultConfig(form, requireCountryContext("HN")) as Record<
      string,
      unknown
    >;
    const values: Record<string, unknown> = applyClientProfile(
      form,
      { ...defaults, phone: "+504 2222-2222" },
      profile,
    );
    expect(values.businessName).toBe("Ferretería El Martillo");
    expect(values.taxId).toBe("08011999123456");
    expect(values.address).toBe("Barrio Abajo, Tegucigalpa");
    expect(values.phone).toBe("+504 2222-2222");
    expect(values.color).toBe("#1F4E79");
    expect(form.configSchema.safeParse(values).success).toBe(true);
  });
});
