# three.js add-ons used by the hub

Copied unchanged from three.js r187 (`three/examples/jsm`, MIT, see `LICENSE`), except that each
file imports the core from `three-hub` instead of `three`.

Why they are copied: the hub runs on three r187 (installed as `three-hub`), while PropWorld and
PMG Fight stay on the site's own three r160. The add-ons inside the package import `three` by
name, which would hand them the older copy. To update, copy the same files from the new version
and change that one import.
