---
title: "Deploying Go Microservices With AWS CodeDeploy"
description: "We have a familiar story at FundApps https://www.fundapps.co/ , big monolith, trying to break into microservices, same old same old. We have a dotnet stack,..."
pubDate: "2016-11-08"
---

We have a familiar story at [FundApps](https://www.fundapps.co/), big monolith, trying to break into microservices, same old same old.  We have a dotnet stack, on Windows, which is deployed using Octopus and TeamCity CI.  We wanted to use Go, but weren't interested in the Docker route, so what do you choose in that situation?

### The Change

When deciding to move away from dotnet for some new applications, there are some questions around culture, workflow and learning.  If you are building and testing code on a CI server, then deploying via CI to your environments, it makes to keep the same approach.  The change came in the tooling and technologies, so lots of change, but lots of familiarity.

We did some direct replacements, Linux for Windows, Golang for C# and Codedeploy for Octopus.  This may seem like an odd choice, but it actually allowed us to achieve our core goal.

`How quickly can we get into production and deploy whenever we want`

Considering there was no existing system for doing this on Linux within the company, we had a lot of opportunities, we felt CodeDeploy was a good fit.

### CodeDeploy

For those unfamiliar with [CodeDeploy](https://aws.amazon.com/codedeploy/), its a system that allows for deploying anything to a bunch of servers using simple scripts and uses a straight forward YAML file to describe the deploy.  

The key components are applications, deployment groups, appspec files and revisions.  Deployment groups are the servers you are going to deploy to, based on AWS EC2 tags or auto scaling group name.  An appspec file is the YAML file you will use to describe your deployment, before and after the code is updated, what files to cleanup, where to put new files etc.  Revisions are typically zip or tar files in S3 containing your code ready to be unpacked onto the servers.

### Why CodeDeploy

It sounds like a straight forward service, and it is.  For a startup like FundApps with a small engineering team, having a tool that is hosted, has a solid API and has plugins for CI is essential.  We don't want to spend a lot of time building tooling.  

One way of deploying servers is the bakery model, packaging up AWS images, AMI's, then rolling them out in autoscaling groups.  This is nice because you can use golden images, something that you can roll back to if the new image is not working for example.  This can be quite slow though, especially for a 10MB Go binary, it is actually quite a costly process.

CodeDeploy takes under a minute to deploy and logs all the information about your deployment as it happens, if something goes wrong, it can roll back.  There are options for how you would like your deployment to go as well, all servers at once, one at a time or custom roll outs.  If a one at a time deployment failed on server 1, it will not roll out to server 2 and 3 for example, which gives an opportunity to investigate the deployment.

### App Spec

The App spec file for a sample deploy is simple, the binary, some db migrations, consul service and systemd service file.  Scripts make everything work, stopping the existing service, starting the new once, clean up of files and finally, validating the service is running.  

This is the core part of CodeDeploy, the ordering, user and timeouts are important to get right for consistently smooth deploys.

```yaml
version: 0.0
os: linux
files:
  - source: go_binary
    destination: /opt/go_binary
  - source: go_service.service
    destination: /usr/lib/systemd/system/
  - source: go_service.json
    destination: /etc/consul.d/config
  - source: migrations/
    destination: /opt/go_service/migrations/
hooks:
  BeforeInstall:
    - location: stop_server.sh
      timeout: 300
      runas: root
  AfterInstall:
    - location: setup_db.sh
    - location: start_server.sh
      timeout: 180
      runas: root
  ValidateService:
    - location: check_service.sh
      timeout: 180
      runas: root
```

### The Console

The UI for CodeDeploy is quite clumsy, there are many clicks to get to the information you want and it is hard to jump to the logs quickly.  We use Teamcity for all our deploys though, which makes continuous delivery with CodeDeploy simple to setup.  We will only use the UI when we have to debug something that is prevent a deploy.

Improvements I'd like to see include better cross server inspecting, how a deploy went in total, not just per instance which is currently the case.  

I made a simple UI with a server that has a Go backend and came up with this, which gives much more of a snapshot view of CodeDeploy deployments.

<img src="/images/codedeploy.jpg" class="img-responsive" alt="Apex">
<a href="/images/codedeploy.png" alt="Apex Lambda">Link to image</a>

### Multiple Accounts And Regions

One practice that I'm a firm believer in is multiple AWS accounts, one for production and one for development and testing.  This is made easy by using Terraform of Cloudformation for templating infrastructure.

CodeDeploy sort of works in the way, but it is still not ideal.  Essentially, an AWS account region is its own little world, it doesn't know about other regions or accounts for that matter, so you are left on your own to make that work.  In our setup, we use CI, so each deploy job takes the same zip built in an earlier step, then uploads it to AWS S3.  It is then deployed onto the servers.

If you want to deploy to 3 regions in 2 AWS accounts, you are going to have to script it or utilise some clever build jobs, the TeamCity plugin for CodeDeploy doesn't work for multiple regions, so even using a nice plugin is out.

This comes down to the concept of an environment, which CodeDeploy doesn't support, which is a shame.  If you aren't using a second AWS account, you are probably going to be prefixing your applications with test-app or dev-app.  

I would like to have the ability to "promote" a release from a test environment to a prod environment.

### Building the zip File

CodeDeploy works by essentially taking a zip file copying the contents onto disk, then copy those files to another directory that you decide in your appspec file.  The structure is important, with the appspec being in the root of your zip file, with everything relative to that file in file copy terms.

For our Go services, we want to build the Go binary into a predefined directory with all our other files needed for the deploy.  We use a Makefile for this with the following commands

```sh
go build -ldflags "-X main.version=$(BUILD_NUMBER)" -o infrastructure/go_service
zip -r -j go_app.zip src/github.com/fundapps/go_service/src/infrastructure/*
```

This does a couple of things, the build step sets the build version to the build number of TeamCity.  This is good for 2 reasons, we can access that number in the status endpoint to see what version is on what environment, but it
is also the version that is pushed to Github releases page.  

For debugging, hit the status endpoint, check the version, then you can simply `git checkout 1.214`.

The status endpoint is quite simple, but looks like this

```json
{
  "Database": "Good",
  "Status for SQS queue": "Healthy",
  "version": "1.214"
}
```

We only build this zip file once, then deploy it to both environments assuming that the deployment is successful.  

### Artefacts

Every time we build a zip file, it is uploaded to S3, because of the size we can persist these for a long period of time without incurring huge cost.  This is counter to the bakery model I mentioned earlier, storing a few MB of zips is a lot cheaper than storing terabytes of EBS volumes for AMIs.

### ....Sounds Boring

I know this is not the most exciting way of deploying Go services, I haven't said Docker enough times for good SEO, but that is actually a good point for us.  Boring deployment stories are nice for me because I don't have to worry about them not working.  Deployments using CodeDeploy usually fail because of a bad appspec file, not because the service is doing something wrong.

We are actually doing some really cool stuff.

**Cool Bits**  
We use Consul for service discovery, this drives dynamic config for our apps as well as reloading load balancer configs.  When a new service comes up, either because of deploy or an autoscaling action, Consul will discover the new service, add it to the load balancer using [Consul Template](https://github.com/hashicorp/consul-template) when its healthy and take it out when its not.

We use [envconsul](https://github.com/hashicorp/envconsul) to drive dynamic config changes from the Consul KV store.  If you are currently having to rebuild your server or Docker image because you bake in config, you probably know how a single character mistake can cause you to rebuild and redeploy.  envconsul is the best solution I have seen to prevent that, by giving you lots of options in how the app restart, what values from Consul are going to be injected into your app and what the behaviour should be if something fails.

Finally, we use [Telegraf](https://github.com/influxdata/telegraf) with StatsD in the Go services to send all metrics to Cloudwatch, making it really easy to setup custom metrics in any Go service.

### Conclusion

Considering where our company was 6 months ago, we have done a lot of new things in our code and infrastructure.  This is going to be an iterative process for us, perhaps we'll use ECS and Docker at some point, but for now, the not as sexy way of doing deployments is working great for us, it probably will for you too.
