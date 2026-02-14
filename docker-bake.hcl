variable "TAG" {
  default = "dev"
}
variable "GITHUB_TOKEN" {
  default = "placeholder"
}
variable "GITHUB_OWNER" {
  default = "placeholder"
}
variable "GITHUB_REPO" {
  default = "placeholder"
}
target "mdvault" {
  context = "./mdvault"
  dockerfile = "Dockerfile"
  tags = [ "ghcr.io/victor3spoir/mdvault:${TAG}" ]
  secret = [ 
    "id=github_token,env=GITHUB_TOKEN" ,
    "id=github_owner,env=GITHUB_OWNER" ,
    "id=github_repo,env=GITHUB_REPO" ,
    ]
}