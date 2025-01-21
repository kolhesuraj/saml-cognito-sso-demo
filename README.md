# Setting Up SAML with AWS Cognito

This guide walks through configuring SAML with AWS Cognito to enable Single Sign-On (SSO) with an identity provider like Okta, Azure AD, or any SAML 2.0-compliant provider.

## Prerequisites
1. An AWS account with access to AWS Cognito.
2. A SAML 2.0-compliant identity provider (IdP), such as Okta or Azure AD.
3. Access to the IdP's metadata file or metadata URL.

---

## Step 1: Create a Cognito User Pool
1. Open the **Amazon Cognito** console: https://console.aws.amazon.com/cognito/.
2. Click **"Create user pool"**.
3. Enter a name for your user pool and click **"Step through settings"**.
4. Configure user pool settings (e.g., attributes like email, phone, etc.).
5. Under **"App integration"**, enable **"Cognito User Pool sign-in"**.

---

## Step 2: Set Up App Client in Cognito
1. In the Cognito user pool, go to **"Applications" > "App clients"**.
2. Click **"Add an app client"**.
3. Configure the app client:
   - **App client name**: Enter a name for the app client.
   - Disable **"Generate client secret"**.
   - Enable **"Enable sign-in API for server-based authentication"**.
4. Click **"Create app client"**.

---

## Step 3: Set Up Domain Name
1. In the Cognito user pool, go to **"Branding" > "Domain"**.
2. Go to **"Create resource server"**
2. Enter a unique domain prefix (e.g., `your-app-name`) and click **"Create resource server"**.
   - This generates your Cognito-hosted domain, 
         e.g., `https://your-app-name.auth.us-east-1.amazoncognito.com`.

---

## Step 4: Set Up Environment Variables
## Environment Variables Example
Add the following environment variables to your backend `.env` file:

```plaintext
AWS_COGNITO_CLIENT_SECRET=your-aws-cognito-client-secret
AWS_COGNITO_CLIENT_ID=your-aws-cognito-client-id
AWS_COGNITO_USER_POOL_ID=your-aws-cognito-user-pool-id
AWS_COGNITO_DOMAIN=your-aws-cognito-domain
AWS_COGNITO_DOMAIN_REGION=your-aws-cognito-domain-region
```

also check `.env.example` file for other environment variables
---

## Step 4: Configure App Client SAML Settings
1. In the Cognito user pool, go to **"App clients" > "App client settings"**.
2. Select the **SAML identity provider** you created earlier.
3. Enter **Callback URL(s)**:
   - Example: `https://your-server-url.com/v1/auth/callback` (This refers to backend url).
   - Example: `https://your-app-url.com/auth/callback` (This refers to front end url).
4. Enable grant types:
   - **Authorization code grant**.
   - **Implicit grant**.
5. Enable OpenID Connect scopes:
   - **OpenId**
   - **Email**
   - **Profile**
6. Save the changes.

---

## Step 5: Configure Your Identity Provider (IdP)
### For Okta:
1. Log in to your Okta admin dashboard.
2. Add a new SAML application:
   - Choose **"Create App Integration"** and select **"SAML 2.0"**.
3. Configure the following:
   - **Single Sign-On URL**: `https://your-app-name.auth.us-east-1.amazoncognito.com/saml2/idpresponse`.
   - **Audience URI (SP Entity ID)**: Your Cognito User Pool URN, e.g., `urn:amazon:cognito:sp:you-user-pool-id`.
   - **Attributes**: Map IdP attributes to Cognito attributes (e.g., email → user.email for okta).
4. Save the configuration and download the **metadata XML** or copy **metadata URL**.

---

## Step 6: Configure SAML Identity Provider in Cognito
1. Login in application vai email and password got to **"Company SAML Settings Page"**.
2. Select **"SAML Provider"**: A name for your IdP (e.g., `Okta` or `AzureAD`).
3. Enter one of the following details:
   - **Metadata URL**: You will get metadata URL from you Idp provider dashboard.
   - **Metadata Document**: Upload the IdP's metadata file.
4. Click **"Save Settings"**.

---

## Step 7: Test the SAML Flow
1. Log in to application enter email click on continue
2. now you can see two options select the **SAML Login** option for saml other wise select **Password Login**.
2. The user will be redirected to the IdP's login page.
3. After successful authentication, the user will be redirected back to the Cognito callback URL.
4. Cognito will validate the SAML response and issue tokens (ID token, access token, etc.).
5. The backend will process the tokens and authenticate the user.
6. Backend redirect you to FE callback page

---

## Important Notes
- Ensure the SAML metadata file or URL is always up to date and correct.


---

Let me know if you need help with specific configurations!
