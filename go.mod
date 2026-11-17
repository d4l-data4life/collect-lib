module github.com/gesundheitscloud/collect-lib

go 1.27.0

// Keeps `./...` (go test/vet/build) from walking the JS build output and dependencies, which
// can contain stray .go files. This does not affect what the module zip contains.
ignore (
	./dist
	./node_modules
)

require (
	github.com/d4l-data4life/go-fhir v0.0.0-20261104082846-d0c5564dd20c
	github.com/d4l-data4life/grpc-modules v1.40.0
	github.com/dop251/goja v0.0.0-20261110204830-f493a2b600d6
	google.golang.org/protobuf v1.36.12
)

require (
	github.com/dlclark/regexp2/v2 v2.11.0 // indirect
	github.com/go-sourcemap/sourcemap v2.1.3+incompatible // indirect
	github.com/google/pprof v0.0.0-20230207041349-798e818bf904 // indirect
	golang.org/x/text v0.43.0 // indirect
)
