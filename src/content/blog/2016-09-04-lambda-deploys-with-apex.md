---
title: "Lambda Deploys With Apex"
description: "AWS Lambda https://aws.amazon.com/Lambda/details/ has been around for a couple of years, in that time the way in which you create and deploy functions has be..."
pubDate: "2016-09-04"
---

[AWS Lambda](https://aws.amazon.com/Lambda/details/) has been around for a couple of years, in that time the way in which you create and deploy functions has been streamlined by several tools, Apex is one of them.  [Apex](http://apex.run/) may have only hit the scene about 8 months ago, but since then, has become one of the leading tools in Lambda automation, keeping pace with AWS releases and features.  Here is how we use Apex and Lambda to create a pipeline of services.

## What is Lambda

Amazon say :

> AWS Lambda is a serverless compute service that runs your code in response to events and automatically manages the underlying compute resources for you.

The word serverless is used to describe your usage, rather than Amazons, as everything still runs on their servers.  Another way of describing Lambda is functions as a service, running code based on events or invoke by other AWS service calls.  An example would be sending a Cloudwatch message to slack if a Cloudwatch alarm goes into alarm state for more than 5 minutes.  Another would be to trigger a Lambda function when a file is uploaded to S3.

## Just paste the code into the console, right?

Amazon love to demo pasting code into the AWS console as a way to deploy Lambda functions, but this isn't really practical for teams who use version control.  Git, for example, can aid in determining what code is actually running in your function.  Things become especially hard if you upload dependencies and have a zip file with 200mb of NPM dependencies.  Then you have to download the zip file to figure out what is in there.

For any kind of consistency, you want to use a central build system, a CI server, that will control the packaging and uploading of your functions and potentially, your deployment.  There are many tools to aid in this, [Gordon](https://github.com/jorgebastida/gordon) and [Apex](https://www.github.com/apex/apex) are two that focus on Lambdas.  This is of course the [Serverless framework](https://github.com/serverless/serverless), but this is more suited to full blown web apps, rather than just deploying Lambda functions.  

## Going Serverless...

Slight pun here, because despite being able to write code in Python, JavaScript(node.js) and Java, I write all my Lambda functions in Go.  This is not an officially supported way of running Lambda functions, but it works great none the less.  
If you want to run any kind of complex function, you will have to upload dependencies, AWS lets you have up to 250mb(compressed).  This will mean that using just the console is out, so using a single static binary works nicely in this situation.  

I achieved the running of a Go binary by wrapping the execution in a JavaScript shim.  The only downside here is having to have node.js installed, but hopefully AWS can support Go natively and this will solve this issue.

When Apex came along, it solved the problems I was facing, managing the JavaScript shim, packaging, uploading and building the Go binary.  

## Apex

[Apex](http://apex.run/) supports all the languages that Lambda supports, as well as Go, built as a command line interface(CLI) tool.  It makes it easy to create Lambdas, but also to manage the infrastructure around them.  By default it supports Terraform, a wrapper around the AWS API.  Conversely, Gordon and Serverless both use Cloudformation.

Apex creates the Lambda and uploads using the API, this is different to the others in that Cloudformation does everything, allowing for referencing later in other Clouformation stacks.  You can create the Lambda functions ahead of time, then deploy to them though, so your workflow should be unaffected by Apex.  For my usage, only the Lambda creation, role assumption and upload is controlled by Apex.

### Example Project

The project structure for a single Lambda with one environment will be quite simple, a functions directory with a function name, function code and function.json file.  

```sh
|____project.json
|____functions
| |____firstLambda
| | |____firstLambda.js
| | |____function.json
```
There is also a project.json file at the root, where the apex CLI is used from.  This containers project wide options so that you don't need to set the same options for each function.  It can also be basic, such as

```json
{
  "name": "My First Lambda Project",
  "description": "Service glue together some AWS Services"
}
```

The function.json will include all the Apex options, runtime, timeout, environment variables, it looks something like this

```json
{
  "name": "FirstLambda",
  "description": "Some cool Lambda function",
  "memory": 128,
  "timeout": 60,
  "environment": {},
  "runtime": "golang",
  "role": "arn:aws:iam::000000000:role/Lambda-function",
  "vpc": {
    "securityGroups": [
      "sg-acb29383"
    ],
    "subnets": [
      "subnet-cgh5f4e4"
    ]
  }
}
```

While this works for a single Lambda, if you are running multiple environments or even multiple AWS accounts, your project will look like this

```sh
|____project.dev.json
|____project.prod.json
|____functions
| |____firstLambda
| | |____firstLambda.js
| | |____function.dev.json
| | |____function.prod.json
```

## Multiple Environments and Environment Variables

If you decide to simply prefix your function with an environment, `Dev-FirstLambda` for example, that will allow you to test your functions before releasing them to production.  Another way to achieve this is to use different AWS accounts.  As long as the credentials to use Apex are capable, you can control the creation and uploading of Lambdas into multiple AWS accounts.   

Environment variables can be placed into the function.json file, but this may be a too sensitive for say, Github.  For that reason, you can mix the usage of the function.json and the Apex CLI environment variable injection.  What actually happens under the hood is a yaml file is created with your variables in, this is added to the zip file and accessible as a normal environment variable in your application thanks to the JavaScript shim.  

By using Apex, you can invoke your code locally and set environment variables to test, rather than waiting to deploy to AWS to test.  This makes for a quick feedback loop locally and doesn't require any Apex specific code, which prevents too much lock in.  There is one exception with regards to the Go functions, they are wrapped in an apex handler, but that's it.

## Deploying with Apex

Teamcity, Jenkins, CircleCI, however you centrally build your software, they will all work with Apex, even if you are using Windows agents.  What is really nice is that they all support environment variables, so you can create very specific jobs for you Lambda deployments.  If you are running your agents on AWS, setting up your build agents for deployment will be a case of setting the right IAM policy.

Here is an example, though this will give a lot of permissions initially, so restrict once you know how you are going to use Apex.  This policy will allow for VPC based Lambdas,

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "Lambda:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeSecurityGroups"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeSubnets"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeVpc*"
      ],
      "Resource": "*"
    }
  ]
}
```

It should be noted that multiple AWS account deploys using Apex with IAM roles is only possible via a fork, PR is [here](https://github.com/apex/apex/pull/514)

### Variables Outside of CI

If you are using config management via something like etcd or [Consul](https://www.consul.io/), you will want to bring this via your CI server.  I use Consul, so when the CI job runs, a script passes the variables to the Apex CLI after storing them from a Curl request.  We need to  pass in the region that we want to deploy our function to, this is unless the region is set in the project.json.  After our variables, we use the Lambda function name, as well as the environment that we want, in this example, we deploy the FirstLambda function with the dev environment configuration to the eu-west-1 region.

```sh
RAVEN_DSN=`curl -s $consul_host/v1/kv/dev/RAVEN_DSN\?raw`
S3_BUCKET=`curl -s $consul_host/v1/kv/dev/S3_BUCKET\?raw`

apex deploy -r eu-west-1 -s RAVEN_DSN=$RAVEN_DSN \
                         -s S3_BUCKET=$S3_BUCKET \
                         FirstLambda -e dev
```

## The Full Picture

By using Apex, we can achieve some really complex Lambda management, which AWS account, which environment, what environment variables to use, where the environment vars are stored, how we management the creation and upload all in one tool.  Below is an example of how one of my Lambda functions is set up.

Github push kicks of the CI build, config is retrieved from [Consul](https://www.consul.io/), then the Go binaries are built by Apex while all running on Teamcity.  Apex assumes the correct role to deploy to the correct AWS account uploads the zip file created.  In this setup, a cron is setup by Cloudwatch Events that invokes the Lambda function, then events are sent to Cloudwatch logs and Cloudwatch Metrics as well as our exception handling service, Sentry.  Cloudwatch logs invokes another Lambda function itself which sends all Cloudwatch log data to Sumologic for analysis.  


<img src="/images/apex_lambda.png" class="img-responsive" alt="Apex">
<a href="/images/apex_lambda.png" alt="Apex Lambda">Link to image</a>

AWS Lambda is a great tool, but there is much more to using it than just writing code in the AWS console.  It requires some finesse in order to create a pipeline for build, deployment and testing.  Apex defines a way of doing things that makes sense, isn't overly complicated and doesn't require lots of dependencies in order to get going while fitting in with your current infrastructure.

You can read more about [Apex here](http://apex.run/)
