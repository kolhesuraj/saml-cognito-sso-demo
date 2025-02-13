import { Button } from "@/components/ui/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/use-toast";
import { post, get } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as z from "zod";

const emailSchema = z.object({
  email: z.string().email("Invalid email"),
});

const passwordSchema = emailSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const Login = () => {
  const [redirecting, setRedirecting] = useState(false);
  const [isSAML, setIsSAML] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form for email
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  // Form for password
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSAMLLogin: SubmitHandler<EmailFormData> = async (data) => {
    setRedirecting(true);

    // Redirect to SAML login
    const samlRes = await post(
      "auth/saml/sign-in",
      {
        email: data.email,
      },
      { headers: {} },
      false
    );
    if (samlRes?.success && samlRes?.body?.redirectUrl) {
      window.location.href = samlRes.body.redirectUrl;
    } else {
      toast({
        title: "Error",
        description: "SAML login failed! please login with password",
        variant: "destructive",
      });
      setRedirecting(false);
      passwordForm.reset({ email: data.email, password: "" });
      setShowPasswordField(true);
    }
  };

  const handleEmailSubmit: SubmitHandler<EmailFormData> = async (data) => {
    setLoading(true);
    setLoginError("");
    try {
      const res = await post(
        "auth/check-sign-in-options",
        {
          email: data.email,
        },
        { headers: {} },
        false
      );
      if (res?.success) {
        if (res?.body?.isSaml) {
          setIsSAML(true);
        } else {
          setShowPasswordField(true);
        }
        passwordForm.reset({ email: data.email, password: "" });
      } else {
        throw new Error(res?.message || "Email check failed");
      }
    } catch (error: any) {
      setLoginError(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit: SubmitHandler<PasswordFormData> = async (
    data
  ) => {
    setLoading(true);
    setLoginError("");
    try {
      const res = await post(
        "auth/sign-in",
        {
          email: data.email,
          password: data.password,
        },
        { headers: {} },
        false
      );
      if (res?.success) {
        localStorage.setItem("__sidebarOpen", "true");
        localStorage.setItem("__token", res?.body?.accessToken);

        // Optional CSP check
        await get("self");
        navigate("/");
      } else {
        throw new Error(res?.message || "Login failed");
      }
    } catch (error: any) {
      setLoginError(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const setPasswordLogin = () => {
    setShowPasswordField(true);
    setIsSAML(false);
  };

  return (
    <>
      <h1 className="mb-3 text-center text-3xl font-bold">Login</h1>

      {redirecting ? (
        <div className="flex flex-col items-center justify-center">
          <p className="mb-4 text-lg font-medium">
            Redirecting to SAML login...
          </p>
          <LoaderCircleIcon className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isSAML ? (
        <Form onSubmit={emailForm.handleSubmit(handleSAMLLogin)}>
          <div className="flex flex-row gap-5 items-center justify-center">
            <Button
              variant="default"
              disabled={loading}
              type="submit"
              size="lg"
            >
              {loading ? (
                <div className="loaderWrapper flex h-40 items-center justify-center">
                  <LoaderCircleIcon className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                "Login With SAML"
              )}
            </Button>
            <Button
              variant="outline"
              disabled={loading}
              type="button"
              size="lg"
              onClick={setPasswordLogin}
            >
              {loading ? (
                <div className="loaderWrapper flex h-40 items-center justify-center">
                  <LoaderCircleIcon className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                "Login With Password"
              )}
            </Button>
          </div>
        </Form>
      ) : !showPasswordField ? (
        <Form onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
          <FormField
            name="email"
            control={emailForm.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="Enter your email"
                  />
                </FormControl>
                <FormMessage
                  message={emailForm.formState.errors.email?.message}
                />
              </FormItem>
            )}
          />
          {loginError && (
            <div className="text-[0.8rem] font-medium text-destructive">
              {loginError}
            </div>
          )}
          <div className="flex flex-col items-center justify-center">
            <Button
              variant="default"
              disabled={loading}
              type="submit"
              size="lg"
            >
              {loading ? (
                <div className="loaderWrapper flex h-40 items-center justify-center">
                  <LoaderCircleIcon className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </Form>
      ) : (
        <Form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
          <FormField
            name="email" // Bind the email field here too
            control={passwordForm.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="Enter your email"
                    disabled={true}
                  />
                </FormControl>
                <FormMessage
                  message={passwordForm.formState.errors.email?.message}
                />
              </FormItem>
            )}
          />
          <FormField
            name="password"
            control={passwordForm.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Enter your password"
                  />
                </FormControl>
                <FormMessage
                  message={passwordForm.formState.errors.password?.message}
                />
              </FormItem>
            )}
          />
          {loginError && (
            <div className="text-[0.8rem] font-medium text-destructive">
              {loginError}
            </div>
          )}
          <div className="flex flex-col items-center justify-center">
            <Button
              variant="default"
              disabled={loading}
              type="submit"
              size="lg"
            >
              {loading ? (
                <div className="loaderWrapper flex h-40 items-center justify-center">
                  <LoaderCircleIcon className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                "Login"
              )}
            </Button>
          </div>
        </Form>
      )}
    </>
  );
};

export default Login;
