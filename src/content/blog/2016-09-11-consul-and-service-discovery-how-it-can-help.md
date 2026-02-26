---
title: "Consul And Service Discovery, How It Can Help"
description: "Consul https://www.consul.io/ is a tool I've been using the last few months to get a handle on our expanding platform. Consul is a tool built by Hashicorp to..."
pubDate: "2016-09-11"
---

[Consul](https://www.consul.io/) is a tool I've been using the last few months to get a handle on our expanding platform.  Consul is a tool built by Hashicorp to help with service discovery and configuration management featuring key/value store, health checks and DNS forwarding.  The service as a whole is open source, with other tools plugging into the Consul HTTP API.  It's these other tools that have made Consul worthwhile for us, this post will focus on [envconsul](https://github.com/hashicorp/envconsul) and [consul-template](https://github.com/hashicorp/consul-template).

### Sounds great, why do I need it?

If you are running a single app, you are probably very aware of where it is running, what class of server it is on, how many instances, what the up time is, how to deploy it etc.  There comes a point in a lot of companies, big and small, where a single app just isn't the right fit anymore.  

You might go down the route of building micro services or try a service orientated architecture, whatever you decide to do, you want another app to complement your monolith.  That is to say, your monolith is staying around, but you want to be able to build things that are not really in the scope of that project anymore.  In a situation where you are completely cloud, this isn't something you can jump right into without some thought.  Is this new thing you are building an internal service, is it public facing, do I need to have walls between the new app and the old, or does it need to be highly connected.

These sorts of decisions are essential to deciding on whether you need a service like Consul, as not everyone will.  

When you decide you need something like Consul, it is probably because you come to one of the following questions.

 - How do we know when something fails?  
 - How do we know when a new server comes up?  
 - How do we check multiple parts of my internal apps?  
 - How do we update configs from servers coming up and down?  
 - How do we store things like database names, S3 bucket names, other variables?  
 - How do we update variables when they change, do we need to redeploy the app?  

Essentially it boils down to

 - How do we automatically know and control what my apps and infrastructure are doing at any given time

## Discover all the things

Service discovery is quite a big topic, with lots of books written on discovery in distributed systems.  To not repeat what others have already gone into detail about, [here](https://www.nginx.com/blog/service-discovery-in-a-microservices-architecture/) is a post by NGINX about micro services and service discovery which will help in understanding different service discovery approaches.

Some of the take away points are knowing what port, IP address, DC/VPC and whether the service is healthy or not is great for automation with other systems, like NGINX.

Some cloud providers allow you to utilise service discovery without having to run something like Consul.  AWS have the Application Load Balancer(ALB), this joins up nicely with an auto scaling group so that when your servers need to scale due to demand, they are automatically added to the load balancer.  This technique means you can leave your infrastructure to respond to application demands without human intervention.

If you are manually editing NGINX configs, updating server lists or using fixed IP address, you could benefit from using service discovery via Consul.

## OK, but I'm still not sold

It can often be the more practical details that really get people on board with something like Consul, so let's get to the cool stuff first.

There are 3 tools to talk about, Consul, consul-template and envconsul.  Hopefully you know roughly what Consul is and it's main features, but here is a quick refresher.  Consul is a two-part system, server and agent.  The Servers run in a cluster of 3 nodes for high availability and are the single point of truth for any node that connects to it.  Consul has a K/V store, supports DNS forwarding, service health checks and has a fully featured HTTP API.  Consul can host a web UI that is quite nice for viewing the KV store and looking at health checks.  The agent is a service that runs every server in your infrastructure and communicates with the other nodes in your cluster.  This means that Consul is constantly seeding data out to make Consul API calls fast and up to date.

Consul's API is core to the other two tools, consul-template and envconsul.

### envconsul
envconsul can be used to drive dynamic config changes from the Consul KV store and restart your application to take the values.  If you are currently having to rebuild your server or Docker image because you bake in config, you probably know how a single character mistake can cause you to rebuild and redeploy.  envconsul is the best solution I have seen to prevent that, by giving you lots of options in how the app restart, what values from Consul are going to be injected into your app and what the behaviour should be if something fails.  

envconsul is written in Go and is deployed as a single binary.  You wrap your call to your app with envconsul, such as

```sh
envconsul -consul 127.0.0.1:8500 -sanitize -upcase -prefix myvalues/ /opt/my_application
```
What happens here is we specify the consul agent, then use envconsul to force the environment variables to a certain case, upcase, then pull in KV from Consul from a folder, `myvalues`.  The my_application can be anything, so you can print out all of the values from your Consul values using

```sh
envconsul -consul 127.0.0.1:8500 -sanitize -upcase -prefix myvalues env

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
PWD=/
SHLVL=1
HOME=/root
no_proxy=*.local, 169.254/16
_=/usr/local/bin/envconsul
TESTAPP_API_KEY=3234234235sosefse
TESTAPP_S3_BUCKET=testing_bucket
```

Here is a capture from the Consul UI to show the original form of the values.

<img src="/images/consul-ui.png" class="img-responsive" alt="Consul-UI">
<a href="/images/consul-ui.png" alt="Apex Lambda">Link to image</a>

You can obviously do some simple things to prevent failure if Consul wasn't contactable at some point, such as cache the output into a JSON file.  This pattern is used in some Docker systems using a "side car" container, but this could also apply to standard on server apps.  

### Service Definition

Consul has covered a few of the questions I posed earlier, but this is the tool that really puts Consul at the core of you service discovery.  Consul supports the concept of services, which can be anything that you want it to be.  A service has a few basics and is described in a JSON file.

```json
{
  "service": {
    "name": "some-service",
    "tags": [
      "golang"
    ],
    "port": 8080,
    "check": {
      "name": "some-api",
      "script": "curl -s localhost:8080/status",
      "interval": "10s"
    }
  }
}
```

In reality, a service definition can just be a file like this

```json
{
  "service": {
    "name": "some-service",
    "port": 8080
  }
}
```

Either way, your Consul cluster will know about `some-service`, what port it's on and the meta data from the agent.  The agent data will include IP address, datacenter etc.  

When a Consul agent is started and this file is found in its config.d directory, it will register with the cluster.  This will occur for every instance of the service, so you will know which servers your app is running on, what their IP's are and what port they are running on.   Taking a closer look at the first example, there is a health check, this combined with the service information means that if your health check fails, the instance of the app will not be included when queried by consul-template.  This is useful when you are reliant on a DB, cache, external service and it goes down for that instance, you don't want it to be in service anymore.  This type of service availability is much more powerful than just a TCP or HTTP check, meaning much more thorough checking before a service is considered healthy.

### consul-template

[consul-template](https://github.com/hashicorp/consul-template) provides a convenient way to populate values from Consul into the file system using the consul-template daemon.  In the same way we saw values injected into an app using envconsul, we can dynamically update files and reload applications such as [HAProxy](http://www.haproxy.org/).

consul-template will only write healthy checks of apps, so you can be sure that your services are not going to be full of unhealthy apps.  consul-template has a large array of options, with either a CLI or config file driven configuration.

Here is an example of using consul-template with HAProxy

```sh
consul-template -consul 127.0.0.1:8500 -template "/etc/haproxy/haproxy.ctmpl:/etc/haproxy/haproxy.cfg:service haproxy restart" -retry 30s
```

The `ctmpl` file contains the Go template syntax, so it is quite simple to write complex configs.  In my example, the Consul dashboard is being exposed but the Consul health check operates on port 8300, so the web UI wouldn't be accessible.  With a little conditional logic, we can view the dashboard on a different port, 8500 in this case.  

The template is also full of ranges, populated by Consul defined services that fill out the server's, port and name sections.  This is where the service definition file data is used, building a full HAProxy config.


```go
{{range services}}
acl is_{{.Name}} hdr(host) -i {{.Name}}.example.com
{{end}}
{{range services}}
use_backend {{.Name}} if is_{{.Name}}
{{end}}

{{range services}}
{{ if .Name | contains "consul" }}
backend {{.Name}}
        mode http
        balance roundrobin
        {{range service .Name}}
        server {{.Name}} {{.Address}}:8500 {{end}}
{{else}}
backend {{.Name}}
	mode http
	balance roundrobin
	{{range service .Name}}
	server {{.Name}} {{.Address}}:{{.Port}} {{end}}
{{end}}{{end}}

frontend stats
	bind *:1936
	default_backend stats

backend stats
	mode http
	stats enable
	stats uri /
```

This will generate a file at `/etc/haproxy/haproxy.cfg` that should be thought as read only.  If you need to make hard coded entries, edit the template file and restart the consul-template wrapper service.  

### Looks good, right?

At this point, you will hopefully be thinking, this all sounds great, centralised health checks, config values for injecting, dynamic config generation, but where does it fit in with my company.

Taking a step back for a moment, this post is aimed at those who don't have a service like this currently and are thinking about it.  Or perhaps you are a company that wants to know if it is worth the learning time and want to justify implementing a new system like Consul.  As i've mentioned previously, there are a few reasons to run Consul, but it comes down to how much you already have in place.  Do you have a health check service, central config store, how do you do load balancing and are you wanting to run [HAProxy](http://www.haproxy.org/) or [NGINX](https://www.nginx.com/) instead of a cloud provider?

I like to think about it like this, once your cluster is up, all you need to do is write a 10 like JSON file and your service can be automatically discovered, load balanced, be DNS reachable and have health checks.  I recently rolled out a [Grafana](http://grafana.org/) server, it was based on a AMI bake and once it started I could see it passed health check and could visit the app immediately.  I could have easily created an route53 entry on an ELB with ASG and EC2 instance and made it the same way, but this assumes a lot about my infrastructure knowledge.  

I recently was setting up a service with another developer and once we had the health check file in place, our goal was simply to get a check light in Consul.   Once we did, the app was working and we could hit the apps API.  There are always going to be resources needed for deploying on cloud which may be a more infra team task, but once you have them in place, creating a new service can be as easy as creating a CI job, Docker image or baking an AMI.

## Lots More

Consul has a lot more to offer than I've mentioned, with most people picking and choosing which features to take advantage of. If you feel like building your own service, have a look at the [Watches](https://www.consul.io/docs/agent/watches.html) part of the API, it can really help to run custom scripts based on events.  An example would be sending a slack message when a service goes critical, [example](https://github.com/AcalephStorage/consul-alerts).  There are also lots of things that plug into Consul, Hashicorp's own [Vault](https://www.vaultproject.io/), but also some cool projects like [Fabio](https://github.com/eBay/fabio) and [Traefik](https://github.com/containous/traefik).  

You can read the full documentation of Consul here [https://www.consul.io](https://www.consul.io/)
