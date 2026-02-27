variable "TAG" {
  default = "dev"
}

variable "IMAGE_REPO" {
  default = "ghcr.io/victor3spoir/mdvault"
}

target "mdvault" {
  context    = "./mdvault"
  dockerfile = "Dockerfile"
  tags = TAG == "main" ? [
    "${IMAGE_REPO}:main",
    "${IMAGE_REPO}:latest",
  ] : [
    "${IMAGE_REPO}:${TAG}",
  ]
}