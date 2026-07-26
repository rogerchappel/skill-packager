# API

- `scaffoldSkill(dir, name, options)`: create a minimal reusable skill package. Existing scaffold files cause an error unless `options.force` is `true`.
- `validateSkill(dir)`: check required files and approval language.
- `requiredFiles`: canonical file list for v1 packages.

```js
import { scaffoldSkill } from "skill-packager";

scaffoldSkill("./my-skill", "my-skill");
scaffoldSkill("./my-skill", "my-skill", { force: true });
```
