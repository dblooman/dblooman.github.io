---
title: "Cloudformation Updates, What's Happened Since You Started Using Terraform"
description: "CloudFormation, the AWS specific infrastructure as code service, I don't use it anymore....but maybe I should. Maybe you should too."
pubDate: "2016-10-09"
---

CloudFormation, the AWS specific infrastructure as code service, I don't use it anymore....but maybe I should.  Maybe you should too.

## Common Problems.

A couple of years ago, if you were automating your infrastructure, you were probably using CloudFormation.  AWS looked after the state of your application, handled rollbacks, validated your template, it was the best.  You could build multiple AWS services into 1 JSON template, EC2, ELB, Cloudwatch, Route53 all came together to launch an application.  Sounds great, but it actually was really difficult to manage.  

Hardcoding VPC ID's, subnets, Hosted Zone ID's, it was all a bit....non cloud, if that's such a thing.  Many tools were built to take on this challenge, [CFNDSL](https://github.com/stevenjack/cfndsl) and Troposphere were two that BBC used while I worked there.  CFNDSL was so heavily used in our team, a colleague, [Steve Jack](https://twitter.com/stevenjack85), became the maintainer of the project.  We then extended this with another tool for internal use due to the fact we had multiple AWS accounts with multiple environments.  We used a YAML file that was environment specific which could share VPC, Route53, ASG specific variables across multiple stacks, this would have a directory such as :

```sh
|____int
| |____Newsbeat.yaml
|____live
| |____Newsbeat.yaml
|____test
| |____Newsbeat.yaml
```

with our stacks, written in CFNDSL Ruby syntax, looking like this.

```sh
|____cloudfrontdns
| |____aws
| | |____route_53
| | | |____record_set.rb
|____dns
| |____aws
| | |____route_53
| | | |____record_set.rb
|____main
| |____aws
| | |____auto_scaling
| | | |____group.rb
| | | |____launch_config.rb
| | | |____scaling_policy.rb
| | |____cloud_watch
| | | |____alarm.rb
| | |____cloudfront
| | | |____distribution.rb
| | |____ec2
| | | |____security_group.rb
| | |____elastic_load_balancing
| | | |____load_balancer.rb
| | |____iam
| | | |____instance_profile.rb
| | | |____policy.rb
| | |____route_53
| | | |____record_set.rb
| |____template.rb
```

As you can see, we were doing a lot to manage CloudFormation, Ruby DSL with 2 sets of tooling in order to create some JSON.  What we needed was a tool that would manage cross stack resources, template out stacks that are identical(except for parameters) and make it easy to write infrastructure, JSON is not as great for the task.

Turns out Hashicorp figured the same and wrote Terraform.

## Terraform

Terraform is a common syntax for multiple "providers", a provider could be AWS, Azure etc.  This means that the basic concepts, servers, load balancers, databases, take vendor specific parameters while Terraform manages the glue that binds it all together.  It also means multi cloud setups are using the same language to describe infrastructure.  Terraform is now maturing, but a couple of years ago, it was lacking a lot of the AWS resources needed to make it production viable, but it's come a long way.  

## Infrastructure is a living thing

When I started using Terraform, CloudFormation began to look quite primitive.  This was especially clear with the concept of infrastructure as an organism that Terraform embraces, not a collection of CloudFormation stacks that have hardcoded parameters.  

Terraform also allowed for changes to be displayed not just for a single stack, but for changes that impact all your infrastructure.  If you went ahead and tried to delete a VPC that was created in a CloudFormation stack, AWS will happily go head and try to do that for you.  The problem is that 20 other stacks rely on that VPC, so your operation is going to fail.  But you may not know that up front, so you waste time and potentially break infrastructure.  

With Terraform, you can see how a delete VPC event will impact the whole infrastructure, this feature was one of the catalysts for many to transition to Terraform from CloudFormation.

## Is that JSON?

This is a stack I created to setup a service, as you can see, lots of weirdness going on here.  This is because we are generating user data, an EC2 feature that lets scripts and commands be run on boot up of an instance.  In this case, a parameter is being used in conjunction with an RDS instance that is also being setup in the same CloudFormation stack.  There is some syntax to get the service port which is being joined with that parameter, as well as a new line, also loads of spaces.  This sucks.

```json
{
  "Fn::Join": [
    "",
    [
      "        - CATTLE_DB_CATTLE_MYSQL_PORT=",
      {
        "Fn::GetAtt": [
          "ComponentRDS",
          "Endpoint.Port"
        ]
      },
      "\n"
    ]
  ]
}
```

Terraform has the ability to use template files that render user data files using variables that are injected into the template and then out comes a block of user data for use with an instance.  This means at runtime, I can get any part of my infrastructure and use it to build user data.  Further, I can also track changes, meaning if my RDS endpoint changes, my user data for another server will be updated and by extension, the server will be updated.

## Terraform is not a silver bullet

I could write an entire post on why I have a love/hate relationship with Terraform, it's coming soon, but suffice to say, it has issues.  State isn't handled by a service like AWS, so you have to deal with that yourself, S3 for example.  Your state is an actual file, but you can't check it into version control if you create AWS credentials as the credentials will be listed in the state file.  It lacks some CloudFormation features, like rolling updates.  One of the great things about CloudFormation is the ability to update an AMI in a stack and have it roll out that AMI in a controlled way.  In order to do this exactly the same way in Terraform, you need to learn how to do....CloudFormation.  There are ways around this, but the best way is to use CloudFormation from within Terraform to manage rolling updates, which brings us to the point where we ask, haven't AWS realised what we want?

## CloudFormation, it's about time.

I know the CloudFormation team do a great job, the service is good, but it could be better if more effort was made to understand what 2016 infrastructure design is like. In the last few months, AWS have made a big effort to solve most of the hacky solutions people have been using to resolve dependencies in CloudFormation, but also to probably stop people moving to Terraform.

Firstly, you can use YAML.  As someone that only writes stacks in YAML, this is a good move.  In doing this, there are some new features in the AWS CloudFormation syntax.

```yaml
Mappings:
  RegionMap:
    us-east-1:
      32: "ami-6411e20d"
      64: "ami-7a11e213"
Resources:
  myEC2Instance:
    Type: "AWS::EC2::Instance"
    Properties:
      ImageId: !FindInMap [ RegionMap, !Ref "AWS::Region", 32 ]
      InstanceType: m1.small
```

This new !FindInMap function is nice because you no longer need to use multiple lines, though if you didn't know, the bang(!) is a part of the syntax, rather than a logical not operation.

## Cross Stack Referencing!!

Yes, my stacks can know about each other.  This is one of the best things released this year by AWS.

You can get started by using the outputs functionality.  In the example below, you can also see the new !Sub syntax, great for interpolation.

```yaml
Outputs:
  VPCId:
    Description: VPC ID
    Value:
      Ref: VPC
    Export:
      Name:
        !Sub '${AWS::StackName}-VPCID'
  PublicSubnet:
    Description: The subnet ID to use for public web servers
    Value:
      Ref: PublicSubnet
    Export:
      Name:
        !Sub '{AWS::StackName}-SubnetID'
  WebServerSecurityGroup:
    Description: The security group ID to use for public web servers
    Value:
      !GetAtt
        - WebServerSecurityGroup
        - GroupId
    Export:
      Name:
        !Sub '${AWS::StackName}-SecurityGroupID'
```

Watch as your YAML linter goes crazy with these syntax tags.  In any case, we can see the stack name being used to create a "name" for the variable to be used in another stack.  Interestingly, you can't see the name values in the AWS console.

Let's assume this stack is the first stack you created and it's called CoreStack.  Your second stack will look something like this

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  AppServerSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: Enable HTTP ingress
      VpcId: !ImportValue CoreStack-VPCID
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: '80'
          ToPort: '80'
          SourceSecurityGroupId: !ImportValue CoreStack-SecurityGroupID

```

As you can see, for the life of this stack, there will be a relationship between the two stacks.  The syntax is quite nice too, the shorthand YAML syntax is simple and has the potential to support strings, arrays etc.  There is also a more secure feeling here, in Terraform, you can go ahead and create a reference to something anywhere in your infrastructure.  With these outputs, you are defining what should be accessible by other stacks.  Obviously, if you reference lots of things, you are going to build up a huge list of outputs, but that is more likely on core stacks and not on application/generic stacks.

Also note that you can use dynamic variables in imports, this uses `Fn::ImportValue`.  For example, importing the value of a security group ID from another stack.

```json
{
  "Fn::ImportValue": {
    "Fn::Sub": "${CoreStack}-SecurityGroupID"
  }
}
```

## Looking good, but that mess from earlier?

CloudFormation doesn't have baggage, it travels light, it wants a complete stack at upload time.  I still feel the CLI tool could implement a file templating feature, but the CloudFormation team have a solution that does make it easier to substitute variables, sort of.

```json
{
  "Fn::Join": [
    "\n",
    [
      {
        "Fn::Sub": [
          "        - CATTLE_DB_CATTLE_MYSQL_PORT=${RDSEndpoint}",
          {
            "RDSEndpoint": {
              "Fn::GetAtt": [
                "ComponentRDS",
                "Endpoint.Port"
              ]
            }
          }
        ]
      }
    ]
  ]
}
```

So we actually have more code than previously, but it is clear what is going on, a variable of RDSEndpoint is going to be added to the string preceding it.  The YAML layout is actually better, but I still feel this is an enhancement enough for shorter substitution.

Here is what a simple reference sub looks like, much nicer.

```json
{
  "Fn::Sub": "/opt/aws/bin/CloudFormation-init -v --stack ${AWS::StackName}"
}
```

OK, it's never going to be as good as Terraform, but if you are staying away from cloud init because of the syntax, you should try this new style.

### CloudFormation Plan...I mean Change sets

CloudFormation has seen the power of Terraform plan, the ability to view your changes ahead of time and created change sets.  This is a much much much, much * 1000 feature.  

Change sets work by indicating what you want to change and AWS will actually store that change set for you to apply.  What that means is that you can create a change set, have AWS store it for review, then determine if it is good to execute.  This is a great workflow choice and is great for Pull Requests.

In case you are wondering what happens if you delete a stack that is being used by another stack, the answer is nothing.  You will get an error message of "Export CoreStack-VPCID cannot be deleted as it is in use by OtherStack".  

If you're using any automation around CloudFormation, use the create changes API, it will probably make you wonder how you did infra before.

## So, I'm going back to CloudFormation, right?

No.  Not yet.

While I have problems with Terraform, it still wins, for now.  CloudFormation still has a long way to go to become the best way to orchestrate AWS, which is quite a thing to say given how short a time Terraform has been around.

I would like to see CloudFormation as a broader tool.  As an example, I decide to change 4 CloudFormation stacks at the same time, now I have 4 change sets and I can't see what the impact is across those 4 stacks from all the changes, only the changes from the stack in the change set.  So yes, reviewing is nicer, but it is a one at a time approach.

This is where the 'infrastructure as a living organism' comes into the fore.  If you need to replace the kidneys in a human, you don't do 3 surgeries, taking 1 out at a time and then putting 1 back in, you do one surgery.  The idea of stacks is great, but as people begin to have dosens of stacks that are dependant on each other, changes are going to become more difficult.  What might happen is people don't use other stacks because it becomes difficult to scope the changes, particularly for IAM and S3 policy files.  I'm sure the team at AWS see the potential, but it is a concept Terraform got right from very early on, so perhaps CloudFormation needs to become something new, something designed for the post Lambda, Docker, microservice world.
