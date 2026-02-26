---
title: "Deploying To A VPS Without The Hassle"
description: "It's a question that gets asked with quite a lot of answers, Docker, Ansible, CodeDeploy, Chef, the list goes on. The idea should be simple, taking code from..."
pubDate: "2017-09-10"
---

It's a question that gets asked with quite a lot of answers, Docker, Ansible, CodeDeploy, Chef, the list goes on.  The idea should be simple, taking code from a VCS and running it on a server, deploying from a laptop or CI, it should be straight forward.  With the advent of Serverless, deploying code quickly has become the norm, the feedback loop is fast and the entire process has moved into the developers realm.

A while ago, AWS released a service called Lightsail, basically a $5 a month VPS.  The service came along with a few prepackaged services light Wordpress, so new AWS users could come to AWS without having to learn much about AWS or setting up a server.  This is great up until the point you want to do the main thing you do with a VPS, deploy some code.

My main annoyance is that tutorials using a VPS usually focus on server side work, git cloning, install a bunch of development software, adding more credentials etc.  In reality, you don't need all that if you want to deploy a few lines of Ruby or a simple Node app.  

My aim with Fasten was to solve that problem with simple Unix commands, SSH and SCP.

### What are we currently doing

In a development feedback loop, you are probably going to be adding dependencies, files, folders etc, so all that needs to also exist on the server.  So we need to be able to have a blank server, copy some code to it, install the dependencies, then run the application.  Then we need to repeat.  

This means OS specific requirements, such as languages and C libraries that are needed for normal Ruby/Node/Go apps.  That is handled in the installation phase of Fasten, by detecting what languages you are running and installing the runtimes.

Application specific updates, such as adding a new npm package since the last time you deployed means running `npm install` on every deploy.  If you think about all the manual steps you would normally run here, imagine having to debug live on a remote server, it can be tedious.

Finally, we have process management, SystemD, init.d, which do you use, how do they work etc, this is becoming a devops challenge very quickly.  Once we want to deploy our code, we would have to kill the running application, then start it, so a bit of `ps aux | grep` commands.  

### What Fasten does

Fasten is a command line tool that uses a simple Yaml file to manage the deployment, process, installation and logs of your application without any remote code running on the server.  It runs everything over SCP and SSH and ensures you don't have to every SSH onto your server.  

Start by running `fasten init`, this will walk you through general setup.  Once you have the setup sorted, run `fasten install`, this will update the OS and install all the language runtimes.  Finally, deploy your code by running `fasten deploy`.  From now on, you will only have to run fasten deploy.

Below is an example of deploying to a server, be aware, the nokogiri gem is very slow to install, but it does complete.

<img src="/images/fasten-deploy.gif" class="img-responsive" alt="fasten">
<a href="/images/fasten-deploy.gif" alt="fasten">Link to image</a>

### Try it out
If you want to given some feedback on Fasten, you can get the code here [https://github.com/DaveBlooman/fasten](https://github.com/DaveBlooman/fasten)
