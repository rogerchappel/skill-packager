# API

- `scaffoldSkill(dir, name, options)`: create a minimal reusable skill package. `name` must be a non-empty string containing a non-whitespace character and is validated before filesystem writes. Existing scaffold files cause an error unless `options.force` is `true`. Forced replacement preflights every existing scaffold destination as a writable regular file and throws before changing any scaffold file if one is unusable.
- `validateSkill(dir)`: check that every required path is a readable regular file, validate the manifest, and check approval language. Validation problems are returned rather than thrown.
- `requiredFiles`: canonical file list for v1 packages.

```js
import { scaffoldSkill } from "skill-packager";

scaffoldSkill("./my-skill", "my-skill");
scaffoldSkill("./my-skill", "my-skill", { force: true });
```

`validateSkill` returns `{ ok, missing, failures, warnings }`. Each failure includes `path`, `code`, and `message`; manifest-field failures also include `field`. Failure codes are `missing`, `not_file`, `unreadable`, `invalid_json`, `invalid_manifest`, and `missing_field`. A manifest must be a JSON object with non-empty string `name` and `version` fields.

Approval validation accepts direct requirements such as `Approval is required` and guarded requirements such as `Do not publish without explicit approval`. Negated requirements do not satisfy the contract, including `No approval is required`, `Approval is not required`, and contractions with straight or curly apostrophes such as `Approval isn't required` or `Permission isn’t required`. A package without an affirmative approval requirement returns `ok: false` with an approval warning.
