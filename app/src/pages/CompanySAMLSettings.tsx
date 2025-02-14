import { Button } from "@/components/ui/Button";
import FilePasteInput from "@/components/ui/File-Paste-Input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { get, patch, post } from "@/lib/api";
// import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";

// Schema for validation
const samlSchema = z
  .object({
    provider: z.string().nonempty("Provider is required"),
    metadataType: z.enum(["url", "file"]),
    metadataURL: z.string(),
    metadataContent: z.string(),
  })
  .refine(
    (data) => {
      if (data.metadataType === "url") {
        return data.metadataURL.length > 0;
      }
      if (data.metadataType === "file") {
        return data.metadataContent.length > 0;
      }
      return false;
    },
    {
      message: "Metadata is required",
      path: ["metadataURL"],
    }
  );

type SAMLSettingsFormData = z.infer<typeof samlSchema>;

const CompanySAMLSettings = () => {
  const form = useForm<SAMLSettingsFormData>({
    resolver: zodResolver(samlSchema),
    defaultValues: {
      metadataType: "url",
      metadataContent: "",
      provider: "",
      metadataURL: "",
    },
  });
  const providers = ["Okta", "Azure AD", "Google Workspace", "Ping Identity"];

  const [loading, setLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const onSubmit: SubmitHandler<SAMLSettingsFormData> = async (data) => {
    setLoading(true);
    setSubmitError("");
    try {
      const body = {
        ...(!isUpdate && { providerName: data.provider }),
        ...(data.metadataType === "file"
          ? { metadataX509File: data.metadataContent }
          : { metadataUrl: data.metadataURL }),
      };

      if (isUpdate) {
        await patch("saml/configure", body);
      } else {
        await post("saml/configure", body);
      }
      setLoading(false);
      toast({
        title: "Success",
        description: "SAML Configuration successfully",
        variant: "success",
      });
    } catch (error: any) {
      setLoading(false);
      setSubmitError(error.message);
    }
  };

  useEffect(() => {
    // Fetch data when the form loads
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await get("saml/configure");

        if (response.success) {
          const { config } = response.body;
          setIsUpdate(true);
          // Assuming the API returns the form data
          form.setValue("provider", config.providerName.split("-")[0]);
        }
      } catch (error) {
        console.error("Error fetching form data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMetadataTypeChange = (value: "url" | "file") => {
    if (value === "url") {
      form.resetField("metadataContent");
      form.clearErrors("metadataContent");
    } else {
      form.resetField("metadataURL");
      form.clearErrors("metadataURL");
    }
    form.resetField("metadataType");
    form.setValue("metadataType", value);
  };

  return (
    <div className="bg-gray-100">
      <div className="w-4/6 max-w-4/6 rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-6 text-2xl font-bold">Company SAML Settings</h1>
        <Form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Provider Dropdown */}
          <FormField
            name="provider"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider</FormLabel>
                <FormControl>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage
                  message={form.formState.errors.provider?.message}
                />
              </FormItem>
            )}
          />

          {/* Metadata Type Selection */}
          <FormField
            name="metadataType"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Metadata Type</FormLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={handleMetadataTypeChange}
                  className="flex"
                >
                  <div className="mr-6 flex items-center space-x-2">
                    <RadioGroupItem
                      value="url"
                      id="url"
                      className="h-4 w-4 bg-white"
                    />
                    <Label className="text-sm font-normal" htmlFor="url">
                      URL
                    </Label>
                  </div>
                  <div className="mr-2 flex items-center space-x-2">
                    <RadioGroupItem
                      value="file"
                      id="file"
                      className="h-4 w-4 bg-white"
                    />
                    <Label htmlFor="file" className="text-sm font-normal">
                      File
                    </Label>
                  </div>
                </RadioGroup>
                <FormMessage
                  message={form.formState.errors.metadataType?.message}
                />
              </FormItem>
            )}
          />

          {/* Metadata Input */}
          {form.watch("metadataType") === "url" ? (
            <FormField
              name="metadataURL"
              control={form.control}
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Metadata URL</FormLabel>
                  <FormControl>
                    <Input {...field} type="text" placeholder={`Enter URL`} />
                  </FormControl>
                  <FormMessage />
                  <div>
                    <p className="text-sm text-gray-600 mb-6">
                      Please provide the <strong>Metadata URL</strong> of your
                      SAML provider. These are required to configure your SAML
                      connection. If you're unsure how to obtain these, refer to
                      your SAML provider's documentation or contact support for
                      assistance.
                    </p>
                  </div>
                  <FormMessage
                    message={form.formState.errors.metadataURL?.message}
                  />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              name="metadataContent"
              control={form.control}
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Metadata File</FormLabel>
                  <FormControl>
                    <FilePasteInput
                      value={field.value}
                      onChange={field.onChange}
                      accept=".xml"
                    />
                  </FormControl>
                  <FormMessage />
                  <div>
                    <p className="text-sm text-gray-600 mb-6">
                      Please upload the <strong>x509.xml</strong> file or paste
                      the <strong>content of the file</strong> from your SAML
                      provider. This file is required to configure your SAML
                      connection. If you're unsure how to obtain this file,
                      refer to your SAML provider's documentation or contact
                      support for assistance.
                    </p>
                  </div>
                  <FormMessage
                    message={form.formState.errors.metadataContent?.message}
                  />
                </FormItem>
              )}
            />
          )}

          {/* Error Message */}
          {submitError && (
            <div className="mt-2 text-sm font-medium text-destructive">
              {submitError}
            </div>
          )}
          <FormMessage message={form.formState.errors.root?.message} />

          {/* Submit Button */}
          <div className="">
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
                <>Save Settings</>
              )}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default CompanySAMLSettings;
