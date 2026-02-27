variable "TAG" {
  default = "dev"
}

variable "REGISTRY" {
  default = "ghcr.io/victor3spoir/mdvault"
}

target "mdvault" {
  context    = "./mdvault"
  dockerfile = "Dockerfile"
  tags = TAG == "main" ? [
    "${REGISTRY}:main",
    "${REGISTRY}:latest",
  ] : [
    "${REGISTRY}:${TAG}",
  ]
}