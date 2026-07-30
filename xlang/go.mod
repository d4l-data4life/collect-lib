// Cross-language check for the v4 hybrid format. Depends only on the PUBLIC, released
// go-crypto — never on anything internal — so this module can be built by anyone who
// checks out collect-lib. It is not part of the published npm package (see "files" in
// package.json) and is not needed to build or use the library.
module collectlib/xlang

go 1.25.0

require (
	github.com/d4l-data4life/go-crypto v1.1.0
	github.com/ethereum/go-ethereum v1.17.0
)

require (
	github.com/gofrs/uuid v4.4.0+incompatible // indirect
	github.com/golang-jwt/jwt/v4 v4.5.2 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	golang.org/x/crypto v0.52.0 // indirect
)
