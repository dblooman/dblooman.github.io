---
title: "Creating An Alarm Service Using AWS Lambda And Slack"
description: "Lambda http://aws.amazon.com/lambda/ by Amazon http://aws.amazon.com/ was a service launched last year and was in preview until a few weeks ago https://aws.a..."
pubDate: "2015-05-02"
---

[Lambda](http://aws.amazon.com/lambda/) by [Amazon](http://aws.amazon.com/) was a service launched last year and was in preview until a [few weeks ago](https://aws.amazon.com/blogs/aws/aws-lambda-update-production-status-and-a-focus-on-mobile-apps/).  Now it has general availability and arrived with support for [SNS](http://aws.amazon.com/sns/).  This opens up a lot of options for connecting AWS services to your workflow, especially for when things break.

### The Idea
Consume SNS messages from Cloudwatch Alarms into a Lambda function, parsing it and posting the data we want to Slack to notify us when something is going wrong.
<img src="/images/alert.png" class="img-responsive" alt="Alert">

### Lambda
According to Amazon,
> AWS Lambda is a compute service that runs your code in response to events and automatically manages the compute resources for you, making it easy to build applications that respond quickly to new information.

If you are already using AWS for things like [EC2](http://aws.amazon.com/ec2/) and [Cloudwatch](http://aws.amazon.com/cloudwatch), you can achieve things that normally would have been handled by another service cheaply and easily using Lambda.  

**What Can Lambda Do?**

Lambda has native support for node.js and Java, but I don't know either of those and so had to find an alternative.  Although it isn't totally clear, you can essentially shell out to the file system underneath a function, which shows you have other options such as Python.  Things look good, but our team are Rubyists, so I thought about packaging Ruby and running a function.  Lambda is capped at 30MB, but I still got Ruby running in a Lambda function, with 800kb to spare....

Things like Ruby gems weren't usable and it seemed clunky to use Ruby in this way, but it made me think that even node.js isn't the best solution.

[Golang](https://golang.org/) is something I've been using in my personal projects and it allows for a single binary to be created, meaning you just need to shell out and call the binary in your function.  I think this is a nice solution for single process jobs such as Lambda, so that's what I ended up going with.

### SNS & Lambda
Shortly after announcing SNS support for Lambda I attended the AWS Summit in London, I came away with an idea for helping us know when something was failing,

**Cloudwatch > SNS > Lambda > Slack**

[Slack](https://slack.com/) comes with great support for webhooks and advanced formatting, not to mention desktop and mobile apps as well as emailing you when you get a mention.  This would give us a cheap, simple way of getting alerts, so I started putting it together.

### Messages
Cloudwatch alarms are a good example of event driven compute, you need to know when your server is melting.  How you get that information is actually a big deal, with many companies offering fully featured dashboards and incident management when something goes wrong.  If you decide you want to run your own service, simply to pick up alarms and send a notification to your phone, you might think Email and SNS.  SNS has the ability to send Email as well as Push notifications to apps and services, so why isn't this enough?  

Email isn't always the best option; I can't get my work Email on my phone without using the web browser.  There are also companies who don't allow for Email outside of the office.  There is a question of availability too; there are situations where our work email servers are turned off to stop fishing attacks, so relying on one information source is a mistake.  

### Third Party Services
If there is one service that knows this, it's [PagerDuty](www.pagerduty.com), offering app push messages, phone calls, text and Email alerts.  Recently, my team launched a new website, [http://www.bbc.co.uk/newsbeat](http://www.bbc.co.uk/newsbeat) on AWS, so we are taking turns to go on-call.  Coming from a company where teams going on-call is relatively new, we still have a lot of people and procedures in place to make it a lot easier for the dev team.  When something goes wrong, our operations team try to fix the issue based on our runbook, if they can't resolve the issue, we get called.

With this in mind, services like PagerDuty were deemed unnecessary by the higher ups, so we're back to Emails and in need of something better.

### Sonitus
The code for the Lambda function is open source and available on [Github](https://github.com/BBC-News/sonitus).  The code is split into a JavaScript file that calls the Go binary and the Go file, which posts to Slack.  There is also a debug folder with example JSON for those who want to try it out before integrating.  

Build the binary as per the readme; zip the binary and the index.js file together, and upload it as a new Lambda function.  Once you have set up your Cloudwatch alarms, create an SNS topic and create a new subscription to point to your new Lambda function, that's it.

What you get in Slack is something that looks like this :

<a href="/images/slack.png" alt="Grafana">Link to image</a>

<img src="/images/slack.png" class="img-responsive" alt="Slack">

You can customise the message based on your alarm structure, but the default layout is pretty simple, the alarm state, the alarm name, the description, a link to that alarm in the AWS console and the time of the alarm going off or being resolved.  You will also see a colour based on the alarm state.

The only drawback I found was when alarms go to insufficient data, i.e. your application might be doing fine, but you have nothing coming in.  Cloudwatch will send a message indicating it has insufficient data and the alarm goes into this state.  If you have an alarm on something that maybe only metrics an event every other minute, you will get a lot of output in Slack.  For that reason, I have ignored insufficient data messages from Cloudwatch, you will only ever see messages that are in an OK or Alarm state.

### Many More Possibilities
This use case it quite small, Lambda functions can do so much more, replacing EC2 in some cases.  What I like about Lambda is that it's event driven, only being called into service when needed, such as when an Alarm goes off.  This type of setup would have previously cost a lot more and would have probably involved a lot more setup, proving just how time saving Lambda can be.  

The next step would be to tie into other services like [goroost](https://goroost.com), which offer web push notifications, or other services that instant messaging, phone calls etc.

It will be interesting to see how the Lambda service improves over time, from my team though, it is something we will use all day, every day, but only when we need it.
