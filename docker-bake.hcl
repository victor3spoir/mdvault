variable "TAG" {
  default = "dev"
}
target "postscms" {
  context = "."
  dockerfile = "Dockerfile"
  tags = [ "postscms:${TAG}" ]
}