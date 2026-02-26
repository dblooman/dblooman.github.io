---
title: "Cross Account AWS Lambda Deployments"
description: "I recently talked at the Serverless London meetup https://www.meetup.com/Serverless London/events/236664340/ , I was asked about how we do cross AWS account..."
pubDate: "2017-02-07"
---

I recently talked at the [Serverless London meetup](https://www.meetup.com/Serverless-London/events/236664340/), I was asked about how we do cross AWS account deploys with Lambda functions.  You can see the [slides here](https://speakerdeck.com/daveblooman/deploying-with-apex) and the [video here](https://www.twitch.tv/videos/119142356­).

This way of working is great for teams that have many accounts for dev, test, stage or prod.  By using multiple AWS accounts you can benefit from perform isolated testing, locked down prod environments and testing CI integration.  

Here's how we do it.

### Accounts, Accounts, Accounts

To start, you want to be running your deployments from an AWS EC2 instance.  This is usually via a CI server like Jenkins, Teamcity or GOCD.  By using a CI server on EC2, you can use the benefits of IAM roles.

This sets up the deployment model, with one account, A, deploying to account A, then use A to deploy to another account, B.  For example.  

```
Account A CI server -> Account A  
Account A CI server -> Account B  
```
You could also deploy from account A, which could be a tooling account, to other accounts.

```
Account A CI server -> Account B   
Account A CI server -> Account C  
```
Your account setup will depend on the structure of the IAM policies you will need, but follows the same basic structure.

### Identity Access Management

The way the IAM works with cross account deploys is that the CI server will assume a new role, one that enables the deployments.  This may be in the same account or another AWS account.  

For our example, we will be using the example above, with 2 AWS accounts with account A deploying to account A and account A deploying to account B.

#### Policy
This is example templates for Terraform, if you would like the full working example, [visit the Github repo](https://github.com/DaveBlooman/cross_account_deploys).

With Terraform, the first step is to create a role with account A, set the principal to be that of account A in the terraform below.  

```hcl

resource "aws_iam_role" "lambda_assume_role" {
  name = "lambda-assume-role"
  path = "/"

  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::000000000001:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
POLICY
}

resource "aws_iam_role_policy" "lambda_assume_policy" {
  name = "lambda-assume-policy"
  role = "${aws_iam_role.lambda_assume_role.id}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:*"
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
EOF
}
```

### Create Again For Second Account

Now you have done that, duplicate the process except this time, when creating Account B IAM, use Account A AWS ID in the principal section.  This will signal to AWS that you want Account A to be able to assume this role.  You will now have two IAM roles, both can be used to deploy Lambdas with Account A acting as the primary account.

If you are using tool such as [Apex](http://apex.run) that manages all your Lambdas, you will need quite open permissions to create, delete and update functions etc.

### CI Server Role


```hcl
resource "aws_iam_role" "build_agent_access" {
  name = "build_agent_access"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "build_agent_access" {
  name = "ci-agent-access-policy"
  role = "${aws_iam_role.build_agent_access.id}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::000000000001:role/apex_lambda_assume_role"
    },
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::000000000002:role/apex_lambda_assume_role"
    }
  ]
}
EOF
}
```

If you are a cloudformation user, all of the IAM JSON show so far is compatible, just remove the variables and add it to your template.

### Deploy with Apex

Now you have two roles in two AWS accounts, both which can be assumed by the CI build server for deployments.  For Apex, you can deploy easily by using the IAM role option on the command line.

```sh
apex deploy -i arn:aws:iam::000000000002:role/lambda_assume_role
```

What happens in this example is that Apex assumes the role, whether it be A or B, this then hands Apex the permissions to deploy Lambdas, describe VPCs etc.  This scopes all the permissions to just the assumed role, which is typical of how most CI plugins work.  Jenkins and Teamcity plugins that are focused on AWS usually have a box that allows for role based usage for this exact use case.  So whether it be on the command line or using a plugin, the process is the same.

## Conclusion

Setting this up is not that difficult, often the main blockers are permissions cross accounts for specific resources, such as PassRole.  What this process is enables is a tighter focus on security as your roles will be scoped exactly on the permissions you need, which is often counter to some CI setups that use full access.

Don't do that.

Full code used [on Github](https://github.com/DaveBlooman/cross_account_deploys)
