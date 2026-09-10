When managing Kubernetes clusters, one of the essential components you'll interact with is the kubeconfig file. This configuration file is a critical element in Kubernetes' architecture, as it holds the details required to connect to and authenticate with one or more clusters. Whether you're working on a local development cluster or managing a large-scale production environment, understanding and effectively utilizing the kubeconfig file is key to streamlining your Kubernetes workflow.

In this blog post, we'll dive into the structure of the kubeconfig file, explore its various fields and options, and provide practical tips for managing and customizing your kubeconfig setup to enhance your Kubernetes experience.

## Introduction to kubeconfig file

The **kubeconfig file** is a configuration file used by `kubectl`, the Kubernetes command-line tool, to access [Kubernetes clusters](https://kubernetes.io/docs/concepts/architecture/). It contains details such as cluster information, user credentials, and namespaces. This file enables `kubectl` to communicate with different clusters and perform operations like deploying applications, inspecting cluster resources, and managing the cluster.

Also, kubernetes cluster components like controller manager, scheduler and kubelet use the kubeconfig files to interact with the API server.

Think of the kubeconfig file as the key that `kubectl` uses to unlock access to Kubernetes clusters. Just like a passport or ID card, it holds crucial details like where each cluster is located (the API server address), who you are (your credentials and permissions), and which part of the cluster you're working in (the namespace).

## Components of Kubeconfig file

The playground we are using in this blog is [killercoda Kubernetes playground](https://killercoda.com/playgrounds/scenario/kubernetes) .

You can view the kubeconfig file contexts using this command :

```bash
kubectl config view
```

![](/images/blog/kubeconfig-1.png)

1. **apiVersion** : Specifies the version of the Kubernetes API. In this case, it is v1.
2. **Clusters** : Clusters contains information about the Kubernetes clusters that you can connect to.

   **cluster** :

   **Certificate-authority-data** : Base64-encoded certificate authority data used to verify the Kubernetes server's certificate.

   **Server** : The URL of the Kubernetes API server. In this example, it is https://172.30.1.2:6443.
3. **Contexts** : Contexts define the cluster, user, and namespace that kubectl should use for subsequent commands.

   Context :

   **cluster** : The name of the cluster to use, here it is `kubernetes`.

   **user** : The name of the user to use, here it is `kubernetes-admin`.
4. **Users** : Users section contains information about the users that can access the clusters.

   **user** :

   **client-certificate-data** : This is the base64-encoded client certificate data used for authenticating the user.

   **client-key-data** : This is the base64-encoded client key data used for authenticating the user.

Till now the user we are using is **admin user** who is able to do everything and you can say have all the access to Kubernetes. But if we do not want the user have all the access then we have to create a user in Kubernetes who have the limited access. So, let's create a user in Kubernetes.

## Create a user

Creating a user in Kubernetes involves several steps, including generating certificates, creating a user, and configuring the kubeconfig file.

## Step 1 : Generate Certificates

Generate a private key and a certificate signing request (CSR) for the new user. You can use OpenSSL for this purpose.

```bash
openssl genrsa -out username.key 2048
openssl req -new -key username.key -out username.csr -subj "/CN=username/O=group"
```

## Step 2: Sign CSE with Kubernetes CA

Command to Base64 Encode the CSR.

```bash
cat username.csr | base64 | tr -d '\n'
```

1. **cat username.csr** : This command reads the contents of the username.csr file.
2. **base64** : This command encodes the contents of the file in base64 [format.](http://format.tr)
3. [**tr**](http://format.tr)**-d '\n'** : This command removes any newline characters from the base64-encoded output. This is necessary because the CSR needs to be a single continuous string in the YAML file.

## Step 3: Create a CSR

Now, create a CSR using the the command `vi csr.yaml` and paste the yaml file given:

```yaml
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: username
spec:
  request: BASE64_CSR
  signerName: kubernetes.io/kube-apiserver-client
  usages:
  - client auth
```

Paste the base64 generate key in place of `BASE64_CSR`.

## Step 4: Applying the CSR:

Apply the CSR to the Kubernetes cluster.

```bash
kubectl apply -f csr.yaml
```

This command creates the CSR resource in the Kubernetes cluster.

## Step 5: Approving the CSR:

After applying the CSR, need to approve it.

```bash
kubectl certificate approve username
```

This command approves the CSR, allowing the Kubernetes CA to issue a certificate.

## Step 6: Retrieving the Certificate:

Retrieve the approved certificates.

```bash
kubectl get csr username -o jsonpath='{.status.certificate}' | base64 --decode > username.crt
```

## Create Role and RoleBinding:

## Role:

Defines a set of permissions within a namespace.

### RoleBinding:

Assigns the permissions defined in a Role to a user, group, or service account within a namespace.

Let's say we have a Kubernetes cluster, and we want to allow a user named <username> to read pod information in the namespace.

1. **Create the Role:** The Role pod-reader allows reading pod information (get, watch, list).
2. **Create the RoleBinding:** The RoleBinding read-pods binds the pod-reader Role to the user.

Create a role using the command `vi role.yaml` and paste the Yaml file give below.

```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: User
  name: username
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

With the help of this file, we are trying to tell Kubernetes that the user who has the role of "pod reader" can only "get", "watch" or " list " pods.

After this apply the role using the command `kubectl apply -f role.yaml`.

## Set up kubeconfig

Configure the kubeconfig file to include the new user credentials and context.

### Set User Credentials

```bash
kubectl config set-credentials user --client-certificate=user.crt --client-key=user.key
```

### Verify Contexts

Checking the existing contexts to ensure you are not overwriting any important configurations:

```bash
kubectl config get-contexts
```

### Set Up User Context

Create a new context for the user <username>:

```bash
kubectl config set-context user-context --cluster=kubernetes --namespace=default --user=<username>
```

### Use the New Context

Switch to the new context to start using it.

```bash
kubectl config use-context user-context <context-name>
```

### Verify the configuration

```bash
kubectl config current-context <context-name>
```

```bash
kubectl config view
```

Replace **<context-name>** with your context name and **<user-name>** with your user name.

## Resources:

[Kubesimplify Hindi Channel](https://www.youtube.com/@kshindi) - [Saiyam Pathak](https://hashnode.com/@Saiyampathak)

[kubeconfig file detailed video](https://www.youtube.com/live/42oYVt0k5bc?si=NxqzkrAK_OL75EFY) - [Saiyam Pathak](https://hashnode.com/@Saiyampathak)

[Kubernetes bootcamp](https://youtube.com/playlist?list=PL2z28C0cnXhMSIN0JyZkI1XBg1K3VZ3cV&si=aVYqUKJ8suk3IkOp) - [Saiyam Pathak](https://hashnode.com/@Saiyampathak)

## Conclusion:

In this blog, we explored the structure of the kubeconfig file, how to create and manage contexts, and the commands necessary to interact with Kubernetes clusters. With this knowledge, you should be able to customize your kubeconfig file to suit your specific needs, ensuring a more streamlined and efficient workflow.

If you find this worth reading then do like and comment with your thoughts on the points discussed above.

Make sure to follow me ❤️😊 :

[Twitter](https://x.com/lavishpal408?t=G79kqLmVAx5nk6wNJkmMeQ&s=09) and [LinkedIn](https://www.linkedin.com/in/lavish-pal-678165220)
