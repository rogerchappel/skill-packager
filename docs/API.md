# API

- `scaffoldSkill(dir, name, options)`: create a minimal reusable skill package. Existing scaffold files cause an error unless `options.force` is `true`.
- `validateSkill(dir)`: check that every required path is a readable regular file, validate the manifest, and check approval language. Validation problems are returned rather than thrown.
- `requiredFiles`: canonical file list for v1 packages.

```js
import { scaffoldSkill } from "skill-packager";

scaffoldSkill("./my-skill", "my-skill");
scaffoldSkill("./my-skill", "my-skill", { force: true });
```

`validateSkill` returns `{ ok, missing, failures, warnings }`. Each failure includes `path`, `code`, and `message`; manifest-field failures also include `field`. Failure codes are `missing`, `not_file`, `unreadable`, `invalid_json`, `invalid_manifest`, and `missing_field`. A manifest must be a JSON object with non-empty string `name` and `version` fields.
