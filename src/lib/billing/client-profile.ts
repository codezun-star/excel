import type { AnyTemplateForm, ProfileKey } from "@/templates/types";

/** Perfil de cliente o empresa (plan Negocio; Pro tiene 1 para sus propios datos). */
export interface ClientProfile {
  id: string;
  name: string;
  rtn: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  branding: { color?: string; footer?: string } | null;
}

export const CLIENT_PROFILE_COLUMNS = "id, name, rtn, address, phone, email, logo, branding";

function profileValue(profile: ClientProfile, key: ProfileKey): unknown {
  switch (key) {
    case "name":
      return profile.name;
    case "rtn":
      return profile.rtn;
    case "address":
      return profile.address;
    case "phone":
      return profile.phone;
    case "email":
      return profile.email;
    case "logo":
      return profile.logo;
    case "color":
      return profile.branding?.color;
  }
}

/**
 * Rellena los campos con `profileKey` (nombre, RTN, dirección, logo, color…)
 * con los datos del perfil. Los vacíos del perfil no borran lo que ya hay.
 */
export function applyClientProfile<T extends Record<string, unknown>>(
  form: Pick<AnyTemplateForm, "formFields">,
  values: T,
  profile: ClientProfile,
): T {
  const out: Record<string, unknown> = { ...values };
  for (const field of form.formFields) {
    if (!field.profileKey) continue;
    const v = profileValue(profile, field.profileKey);
    if (typeof v === "string" && v.trim()) out[field.name] = v;
  }
  return out as T;
}
