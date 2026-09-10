In the [previous blog](https://lavishblog.hashnode.dev/demystify-the-kubeconfig-file) we explored the structure of the kubeconfig file, how to create and manage contexts, and the commands necessary to interact with Kubernetes clusters.

In this blog we will be deep diving into how you can access Kubernetes cluster using RESTAPI Calls and concepts of GVK(Group Version Kind) and GVR(Group Version Resource).

![](/images/blog/k8s-restapi-1.png)

Now let's understand from the above picture that the request which user is sending `kubectl run nginx --image=nginx` to API Server no matter how you send it, it will go in json form, even if you send it into yaml, it will get converted and go in json form. It is simply known as RESTAPI Call.

**API Server is the software utility which is an Endpoints and we can directly access these endpoints through RESTAPI Calls, even we don't need kubectl for this.**

But before going deep into RESTAPI Calls, Let's understand some more important concepts for getting the better understanding.

**Let's run a command :**

```bash
kubectl run demo --image=nginx --dry-run=client -oyaml
```

By running this command user is generating the YAML configuration for a pod names `demo` that runs the `nginx` image, but user is not actually creating the pod in the Kubernetes cluster. Instead, user is just viewing the YAML output.

**You can see the Output below:**

![](/images/blog/k8s-restapi-2.png)

Let's understand the above two lines for now:

1. **apiVersion:** This shows that the API version used for this resource is `v1`. It is the core API version for Kubernetes resources like Pods.
2. **kind:** Specifies the type of resource being created. In this case, it is a `Pod`.

**Let's take another example for get the better understanding of apiVersion and kind.**

Run a command :

```bash
kubectl create deploy demo --image=nginx --dry-run=client -oyaml
```

Running this command shows the output of a `kubectl create deploy` command with the `--dry-run=client` and `-o yaml` options, which generates the YAML representation of a Kubernetes **Deployment** without actually creating it in the cluster.

You can see the Output below.

![](/images/blog/k8s-restapi-3.png)

Let's understand the apiVersion and kind in this file also.

1. **apiVersion: apps/v1**

   - **apiVersion** specifies the version of the Kubernetes API to use. Here, `apps/v1` is used for Deployments, which is part of the apps API group.
2. **kind: Deployment**

   - **kind** indicates the type of resource being defined. In this case, it’s a **Deployment**, which manages a set of identical Pods.

***So, there are two things GVK(Group Version Kind) and GVR(Group Version Resource)***

Let’s understand the role of GVK and GVR in above scenario. In above pictures what we are trying to say is “Hey Kubernetes, create a deploy for me”.

![](/images/blog/k8s-restapi-4.png)

Now here comes a trick question😁 : What is deployment here?

Deployment is ***Kind***  here and when it goes into RESTAPI call then it is ***Resource***  . Kind and Resource are same, Resource is just plural of Kind.

Now, before you get angry and lose your temper, let’s understand What is GVK and GVR?

## What is GVK and GVR?

GVK stands for Group Version Kind, GVR stands for Group Version Resource.

Group Version Resource and this is what drives the Kubernetes API Server structure. We will cover exactly what the terminology means for Groups, Versions, Resources (and Kinds) and how they fit into the Kubernetes API.

## Kind:

Kinds in Kubernetes relate to the object you are trying to interact with. A `pod` or `deployment` would be your Kind.

There are three categories of Kinds:

1. **Objects**: These represent individual resources like Pods, Endpoints, Deployments, etc.
2. **Lists**: These are collections of multiple resources of the same Kind, such as a Pod List or Node List.
3. **Special Purpose**: These Kinds are used for specific actions on resources or for non-persistent objects, such as `/binding` or `/scale`.

## Group:

A group is simply a collection of kinds. You can have kinds such as ReplicaSets, StatefulSets, and Deployments which are all part of the `apps` group.

- The API group is a way to categorize related API resources in Kubernetes.
- Resources in the same group share similar purposes, and grouping makes it easier to organize and evolve the API.
- Some common groups are:

  - `apps`: Used for managing applications, such as `Deployment`, `StatefulSet`, etc.
  - `core` (or sometimes referred to as the empty group `""`): Contains core resources like `Pod`, `Service`, `Namespace`, etc.

## Version:

Versions allow Kubernetes to release groups as tagged versions. Here are the versions that Kubernetes has available.

- **Alpha** : This is usually disabled by default since they should only be used for testing. You may see these labeled as `v1alpha1`
- **Beta** : This is enabled by default. However there is no guarantee that any further beta or stable releases will be backwards compatible. You may see these labeled as `v1beta1`
- **Stable** : These have reached maturity and will be around for further releases. You may see these labeled as `v1`

A group can exist within any of these versions, or even across multiple versions. Typically, a group starts in the Alpha stage, then progresses to Beta, and eventually reaches the Stable phase.

## Resource:

Resource is an API object that represents a specific entity or component in the system. The resource is an identifier that receives and returns a its corresponding kind. Resources also expose CRUD actions for that `Kind` .

Now you get the clear Understanding of GVK and GVR. So, let’s move on to the Hand’s on part.

![YARN | Let's go. Let's go! Let's practice. | Hardball (2001) | Video clips  by quotes | 2080cd0a | 紗](/images/blog/k8s-restapi-5.png)

## Create a Service account:

A Service Account allows pods to interact with the Kubernetes API and can be associated with specific permissions through **Role** or **ClusterRole** bindings.

```bash
kubectl create serviceaccount lavish --namespace default
```

Let’s understand what we are trying to say with the help of above command:

- **kubectl:** This is the tool you use to talk to your Kubernetes cluster.
- **create serviceaccount:** You’re creating a new "service account," which is like a user in Kubernetes but for applications or processes, not for humans.
- **lavish:** This is the name you're giving to the service account.
- **--namespace default:** This tells Kubernetes to create the service account in the "default" namespace, which is like a folder or section in your cluster where things are kept

## Create Cluster Role Binding:

```bash
kubectl create clusterrolebinding lavish-clusteradmin-binding --clusterrole=cluster-admin --serviceaccount=default:lavish
```

- **kubectl create clusterrolebinding:** Creating a "cluster role binding," which links permissions (roles) to a user, group, or service account.
- **lavish-clusteradmin-binding:** This is the name we're giving to the cluster role binding. In this case, it is "lavish-clusteradmin-binding."
- **--clusterrole=cluster-admin:** You are assigning the "cluster-admin" role, which has the highest level of access in Kubernetes, to someone. This role lets the account do anything across the entire cluster.
- **--serviceaccount=default:** You are giving these permissions to the service account named **lavish** in the "default" namespace.

> **Replace <lavish> with your service account name.**

## Create a token:

```bash
kubectl create token lavish
```

### Output:

![](/images/blog/k8s-restapi-6.png)

Now we want to talk to Kubernetes but we will not use kubectl or kubeconfig. With this token we are directly trying to talk to API Server.

## Expose the token:

```bash
TOKEN= <output from above>
```

## View the API Server:

```bash
APISERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
```

## Create a Deployment using curl command:

```bash
kubectl create deployment nginx --image=nginx --dry-run=client -o json > deploy.json
```

```bash
curl -X POST $APISERVER/apis/apps/v1/namespaces/default/deployments \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d @deploy.json \
  -k
```

## List Deployments:

```bash
curl -X GET $APISERVER/apis/apps/v1/namespaces/default/deployments -H "Authorization: Bearer $TOKEN" -k
```

**Command Breakdown:**

- **curl**:

  - Curl is a command-line tool used for making HTTP requests to a server. Here, it’s being used to talk to the Kubernetes API server.
- **-X GET**:

  - This specifies the HTTP method being used. `GET` is used to request data from the server. You’re asking the API server to provide information, not make any changes.
- **$APISERVER**:

  - This is a variable that should contain the URL of your Kubernetes API server.
- **/apis/apps/v1/namespaces/default/deployments**:

  - This is the specific API endpoint you're querying.

    - **/apis/apps/v1**: Refers to the `apps` API group, version `v1`, where Kubernetes stores deployment-related resources.
    - **/namespaces/default**: Specifies that you want information from the `default` namespace.
    - **/deployments**: Refers to the "deployments" resource. A deployment is a way to manage applications in Kubernetes. So, this part of the URL means you’re requesting a list of all the deployments in the "default" namespace.
- **-H "Authorization: Bearer $TOKEN"**:

  - This adds a header to the HTTP request. In this case, you're passing an **Authorization** header with a **Bearer Token**.
  - **$TOKEN** is a variable that should contain a valid authentication token for Kubernetes. The token proves that you have permission to make the request. It's typically a service account token or a personal access token.
- **-k**:

  - This flag tells `curl` to ignore SSL certificate warnings. If you're connecting to a Kubernetes API server over HTTPS without a valid certificate or a certificate signed by an untrusted CA, this flag ensures that the connection still works.

## List Pods:

```bash
curl -X GET $APISERVER/api/v1/namespaces/default/pods \
  -H "Authorization: Bearer $TOKEN" \
  -k
```

## Resources:

[Kubesimplify Hindi Channel](https://www.youtube.com/@kshindi) - [Saiyam Pathak](https://hashnode.com/@Saiyampathak)

[kubeconfig file detailed video](https://www.youtube.com/live/42oYVt0k5bc?si=NxqzkrAK_OL75EFY) - [Saiyam Pathak](https://hashnode.com/@Saiyampathak)

[Kubernetes bootcamp](https://youtube.com/playlist?list=PL2z28C0cnXhMSIN0JyZkI1XBg1K3VZ3cV&si=aVYqUKJ8suk3IkOp) - [Saiyam Pathak](https://hashnode.com/@Saiyampathak)

## Conclusion:

In this blog, we explored how to access Kubernetes clusters without using `kubectl` or a Kubeconfig file by directly interacting with the Kubernetes API server using the `curl` command. We also discussed the concepts of **GVK** (Group, Version, Kind) and **GVR** (Group, Version, Resource), which help in identifying and working with different resources in the Kubernetes API.

If you find this worth reading then do like and comment with your thoughts on the points discussed above.

Make sure to follow me ❤️😊 :

[Twitter](https://x.com/lavishpal408?t=G79kqLmVAx5nk6wNJkmMeQ&s=09) and [LinkedIn](https://www.linkedin.com/in/lavish-pal-678165220)
