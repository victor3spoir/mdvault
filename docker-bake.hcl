variable "TAG" {
  default = "dev"
}
target "postscms" {
  context = "."
  dockerfile = "Dockerfile"
  tags = [ "ghcr.io/victor3spoir/mdvault:${TAG}" ]
}