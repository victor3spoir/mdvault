variable "TAG" {
  default = "dev"
}

target "mdvault" {
  context = "./mdvault"
  dockerfile = "Dockerfile"
  tags = [ "ghcr.io/victor3spoir/mdvault:${TAG}" ]

}