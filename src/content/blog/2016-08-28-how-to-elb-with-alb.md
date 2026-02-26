---
title: "How To ELB With ALB"
description: "Amazon recently announced its new load balancer, the Application Load Balancer ALB https://aws.amazon.com/blogs/aws/new aws application load balancer/ . This..."
pubDate: "2016-08-28"
---

Amazon recently announced its new [load balancer, the Application Load Balancer(ALB)](https://aws.amazon.com/blogs/aws/new-aws-application-load-balancer/).  This load balancer can replace all elastic load balancers currently in service as well as offering several new features designed for container based architectures.  While normal load balancers offer support for EC2 based architectures, container based architectures often require [HAProxy](http://www.haproxy.org/) or [NGINX](https://www.nginx.com/) to function effectively.  This is in part due to how applications have been broken up for containers, often using micro services.  

An example might be one application running on port `8080` which has a single route of `/foo` and a second application running on port `9292` with routes of `/bar` and `/baz`.  

If using a single monolithic stack, this wouldn't be an issue as routing is achieved on a single port and managed in one place.  In order to achieve this kind of routing for multiple applications, another service is needed that manages the path matching for you, either on the EC2 instance itself, or externally on separate EC2 instances.  Running Apache on an EC2 instance that is setup to correctly route is quite easy, but does require updating the whole OS image or editing the config on the instance.  If running a maximum of say 3 applications, this wouldn't be so difficult to maintain, but more than that across a large fleet of instances can be slow to update.

### Cool Features
While many other load balancers have had these features for a while, ALB supports HTTP/2 and WebSockets out of the box.  Sticky sessions are also possible, even on WebSockets, which is a great feature for those who haven't taken the WebSocket plunge.  The ALB also comes with a few new metrics to help you target application performance.  Each target group has its own group of metrics, so tracking down which application is performing best/worst should be easier.  Four blocks of HTTP status codes now exist, 2xx, 3xx, 4xx and 5xx.  These are available on both the ALB and the target groups.

### Consul/etcd
Other solutions include running a reverse proxy with a service discovery service such as [Consul](https://www.consul.io/)/[etcd](https://coreos.com/etcd/) using HAProxy as the load balancer instead of an ELB.  This would allow for simple routing to the correct servers or containers without having to setup new load balancers.  While this has its advantages, it is more to maintain and can be difficult to set up.  For automatically adding new containers, you would need to run [consul-template](https://github.com/hashicorp/consul-template) in order to dynamically update the HAProxy config.

A common solution is to use sub domains instead of complex routing setups.  This isn't ideal for applications that have very little responsibility however.  There is also URL consistency when building API's.  For example, an API that can show orders, both by ID and the most recent 10 orders.  The most recent 10 might be `example.com/api/orders/` with by ID being `example.com/api/order/:id` with each being a different application.  This could be because the recent orders endpoint is using data pushed into a cache while by ID is coming from a database.  

Another example would be to make a single orders application which handles both the routes above, then another application that handles customers with similar api structure, `example.com/api/customer/:id`.

What is clear is that an ELB, or a Classic ELB as Amazon is now calling it, can be difficult to utilise with many separate applications.  Where you may have a single monolith, which contains everything, that is attached to a single ELB, routing is not so much an issue.

AWS have often advised using ELB's to form part of service discovery because you can attach them to containers and then have a single endpoint for which to reach your application.  This isn't cheap though, if you run 20 services, you will pay $400 a month and that doesn't include data charges.  Even with ELB's in place, to correctly route your traffic, you will still need to have a service in front of all of them to route to the right load balancer.

This is where the ALB really makes sense.

## The Application Load Balancer

The name given to this new load balancer varies depending on what page of AWS documentation you read.  ALB is the most common name used so far, but AWS have changed the name of ELB to the Classic Load Balancer in several places, so does this mean the ALB is the ELB V2?  Yes according to [CloudFormation](https://aws.amazon.com/cloudformation/), which had support on day 1.  Current ELB's are still ELB's in CFN, not V1, but ALB's are ELBV2.  So ELB's are classic load balancers of the V1 variety and ALB's are load balancers of the V2 variety, hope that clears up all the confusion.

### New Terms

Target Groups and Listener Rules are new, they are the key differentiators to a classic ELB.  An ALB has listener rules, with listener rules having target groups.

A target group, or target, is a port mapping to a container or server that has a health check settings on.  Once setup, the target will look for applications on the port you have selected, then attempt to send traffic once the application is healthy.  A target can be spread across lots of instances, or just one.  Target groups must have unique ports if you are going to run multiple targets on the same server.

Listener rules are where the path matching occurs.  By creating an `/api/orders` route, this is then tied to a target, which is managing the health of your application.  The pattern matching is quite powerful, supporting wildcard expressions, for example `/api/orders/*`.

Normal load balancer listeners are still there to take in traffic on, for example, port 80 and 443.  Security groups then allow traffic to pass from these listeners to your EC2 instances or containers.

### Root Route?

If you are hoping to get the root of every application, you are out of luck. Lets for example say you want to run a app on port `3000` and the app is a third party app that requires it to run at the root, e.g `:3000/`.  This will only work for 1 application, after this, routing must match the pattern as specified.  If you were hoping to run a [grafana](http://grafana.org/) server on `:3000/grafana` for example, you would have to run a reverse proxy on the server to make this work, which defeats the point of using an `ALB`.

The first listener rule you register will also assume the default route, so ensure you have your applications bound to the correct order and have the correct priority.  More details [here](http://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-update-rules.html)

### CloudFormation on Day 1!!!

AWS shipping CloudFormation support on day is a rare treat.  Usually, something like [Terraform](https://www.terraform.io/) has support with a few days, or even a few hours sometimes.  CloudFormation can often take months to catch up, which makes adoption of new features difficult.  If you decided to use the new features with the console or API, you may end up playing the "What are we running in production game?".  Hopefully AWS keeps CloudFormation up to date with ALB updates.

As this is such a great day in AWS land, I have created an [example stack here](https://github.com/DaveBlooman/alb-example) which uses 2 [Docker](https://www.docker.com/) containers with 2 different languages in conjunction with an ALB and ASG.  If you take away the containers, you have a regular EC2 setup, which I think is a bit more helpful than making this a pure [ECS](https://aws.amazon.com/ecs/getting-started/) setup.   

A few pieces to focus on, the listener rule

```json
{
  "Type": "AWS::ElasticLoadBalancingV2::ListenerRule",
  "Properties": {
    "Actions": [
      {
        "TargetGroupArn": {
          "Ref": "ELBTargetGroup"
        },
        "Type": "forward"
      }
    ],
    "Conditions": [
      {
        "Field": "path-pattern",
        "Values": [
          "/golang"
        ]
      }
    ],
    "ListenerArn": {
      "Ref": "ELBListen"
    },
    "Priority": 1
  }
}
```

and how to attach your EC2 instances in your ASG to your ALB

```json
{
  "Type": "AWS::AutoScaling::AutoScalingGroup",
  "Properties": {
    "TargetGroupARNs": [
      {
        "Ref": "ELBTargetGroup"
      },
      {
        "Ref": "ELBTargetGroup2"
      }
    ]
  }
}
```

### ALB All the Time

The question is, should ALB's be used everywhere?  In short, if your tooling has a nice upgrade path, yes.  ALB's offer better metrics and more flexibility down the line, while offering new features like HTTP/2 and WebSockets.  

Does ALB take away the need for HAProxy or NGINX?  Maybe, but there are going to be use cases where ALB doesn't work completely and you will need something for central management.  A simple example is IP restriction, if you have 5 ALB's that are behind HAProxy, you will only change your restriction in one place, instead of 5 security group changes.  

## What Next

Docker recently announced a product called Docker for AWS which can tie in with ELB, but not ALB yet.  Hopefully when this is all figured out, you should be able to create a docker service and publish it on a port and have that map to a route on the ALB.  This is better than having apps run on random ports on the ELB which is what all the demos have shown so far.  Docker Cloud only supports container based load balancing using HAProxy, so that is also out.  Kubernetes has good support for ELB too, but again, not ALB, so that is still to come.  Unsurprisingly, ECS has support, so if you are using vanilla ECS, you can upgrade immediately.  For those using [Empire](https://github.com/remind101/empire), there is an early preview available at time of writing.

Bottom line is that the ALB is a pretty decent product from AWS, with features that make it easier to run microservices and container architectures.

Read more on the [AWS Application Load Balancer](https://aws.amazon.com/elasticloadbalancing/applicationloadbalancer/)
