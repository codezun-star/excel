import { defineTemplate } from "@/templates/define";

import { build } from "./build";
import { form } from "./form";
import { meta } from "./meta";

export default defineTemplate(meta, form, build);
