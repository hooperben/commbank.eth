"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Key, Lock, Trash, Fingerprint } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  initDB,
  generateSecret,
  encryptSecret,
  decryptSecret,
  storeEncryptedSecret,
  getAllEncryptedSecrets,
  deleteEncryptedSecret,
  type EncryptedSecret,
} from "@/lib/db";
import {
  isPasskeySupported,
  isPasskeyRegistered,
  registerPasskey,
  authenticateWithPasskey,
} from "@/lib/passkey";

export default function SecretsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [secrets, setSecrets] = useState<EncryptedSecret[]>([]);
  const [newSecret, setNewSecret] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [decryptedSecrets, setDecryptedSecrets] = useState<
    Record<string, string>
  >({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("password");

  useEffect(() => {
    const setupDB = async () => {
      await initDB();
      await loadSecrets();

      // Check if passkeys are supported
      const supported = isPasskeySupported();
      setPasskeySupported(supported);

      if (supported) {
        // Check if a passkey is already registered
        const registered = isPasskeyRegistered();
        setPasskeyRegistered(registered);

        if (registered) {
          setActiveTab("passkey");
        }
      }

      setIsLoading(false);
    };

    setupDB().catch((error) => {
      console.error("Failed to initialize database:", error);
      toast({
        title: "Database Error",
        description: "Failed to initialize the secrets database",
        variant: "destructive",
      });
      setIsLoading(false);
    });
  }, []);

  const loadSecrets = async () => {
    try {
      const encryptedSecrets = await getAllEncryptedSecrets();
      setSecrets(encryptedSecrets);
    } catch (error) {
      console.error("Failed to load secrets:", error);
      toast({
        title: "Error",
        description: "Failed to load secrets",
        variant: "destructive",
      });
    }
  };

  const handleGenerateSecret = () => {
    const secret = generateSecret(32);
    setNewSecret(secret);
    toast({
      title: "Secret Generated",
      description: "A new random secret has been generated",
    });
  };

  const handleRegisterPasskey = async () => {
    if (!username) {
      toast({
        title: "Error",
        description: "Please enter a username for your passkey",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await registerPasskey(username);
      if (success) {
        setPasskeyRegistered(true);
        toast({
          title: "Success",
          description: "Passkey registered successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to register passkey",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to register passkey:", error);
      toast({
        title: "Error",
        description: "Failed to register passkey",
        variant: "destructive",
      });
    }
  };

  const handleStoreSecret = async () => {
    if (!newSecret) {
      toast({
        title: "Error",
        description: "Please generate or enter a secret first",
        variant: "destructive",
      });
      return;
    }

    try {
      let encryptedSecret: EncryptedSecret;

      if (activeTab === "passkey") {
        // Authenticate with passkey
        const authData = await authenticateWithPasskey();
        if (!authData) {
          toast({
            title: "Authentication Failed",
            description: "Failed to authenticate with passkey",
            variant: "destructive",
          });
          return;
        }

        // Encrypt with passkey
        encryptedSecret = await encryptSecret(newSecret, authData, true);
      } else {
        // Encrypt with password
        if (!password) {
          toast({
            title: "Error",
            description: "Please enter an encryption password",
            variant: "destructive",
          });
          return;
        }

        encryptedSecret = await encryptSecret(newSecret, password, false);
      }

      await storeEncryptedSecret(encryptedSecret);
      await loadSecrets();
      setNewSecret("");
      setPassword("");
      toast({
        title: "Success",
        description: "Secret encrypted and stored successfully",
      });
    } catch (error) {
      console.error("Failed to store secret:", error);
      toast({
        title: "Error",
        description: "Failed to encrypt and store secret",
        variant: "destructive",
      });
    }
  };

  const handleDecryptSecret = async (
    secret: EncryptedSecret,
    passwordOrNull: string | null = null,
  ) => {
    try {
      let decrypted: string;

      if (secret.usePasskey) {
        // Authenticate with passkey
        const authData = await authenticateWithPasskey();
        if (!authData) {
          toast({
            title: "Authentication Failed",
            description: "Failed to authenticate with passkey",
            variant: "destructive",
          });
          return;
        }

        // Decrypt with passkey
        decrypted = await decryptSecret(secret, authData);
      } else {
        // Decrypt with password
        if (!passwordOrNull) {
          toast({
            title: "Error",
            description: "Please enter a decryption password",
            variant: "destructive",
          });
          return;
        }

        decrypted = await decryptSecret(secret, passwordOrNull);
      }

      setDecryptedSecrets((prev) => ({
        ...prev,
        [secret.id]: decrypted,
      }));
      setShowSecret((prev) => ({
        ...prev,
        [secret.id]: true,
      }));
    } catch (error) {
      console.error("Failed to decrypt secret:", error);
      toast({
        title: "Decryption Error",
        description: "Authentication failed or corrupted data",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSecret = async (id: string) => {
    try {
      await deleteEncryptedSecret(id);
      await loadSecrets();
      // Remove from decrypted secrets if it exists
      if (decryptedSecrets[id]) {
        const { [id]: _, ...rest } = decryptedSecrets;
        setDecryptedSecrets(rest);
      }
      toast({
        title: "Success",
        description: "Secret deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete secret:", error);
      toast({
        title: "Error",
        description: "Failed to delete secret",
        variant: "destructive",
      });
    }
  };

  const toggleShowSecret = (id: string) => {
    setShowSecret((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-6">
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold">Encrypted Secrets</h1>

          {passkeySupported && !passkeyRegistered && (
            <Card>
              <CardHeader>
                <CardTitle>Register Passkey</CardTitle>
                <CardDescription>
                  Register a passkey to use for encryption and decryption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter a username for your passkey"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleRegisterPasskey}
                  disabled={!username}
                  className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  <Fingerprint className="h-4 w-4" />
                  Register Passkey
                </Button>
              </CardFooter>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Generate & Store Secret</CardTitle>
              <CardDescription>
                Generate a random secret and encrypt it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secret">Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="secret"
                    value={newSecret}
                    onChange={(e) => setNewSecret(e.target.value)}
                    placeholder="Your secret value"
                    className="flex-1"
                    autoComplete="off"
                  />
                  <Button
                    onClick={handleGenerateSecret}
                    variant="outline"
                    className="gap-2"
                  >
                    <Key className="h-4 w-4" />
                    Generate
                  </Button>
                </div>
              </div>

              {passkeySupported && (
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="password">Password</TabsTrigger>
                    <TabsTrigger value="passkey" disabled={!passkeyRegistered}>
                      Passkey
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="password" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Encryption Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password to encrypt the secret"
                        autoComplete="off"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="passkey" className="space-y-4">
                    <div className="rounded-md bg-muted p-4 text-center">
                      <Fingerprint className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p>
                        You'll be prompted to authenticate with your passkey
                        when encrypting
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {!passkeySupported && (
                <div className="space-y-2">
                  <Label htmlFor="password">Encryption Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password to encrypt the secret"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleStoreSecret}
                disabled={!newSecret || (activeTab === "password" && !password)}
                className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                {activeTab === "passkey" ? (
                  <Fingerprint className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Encrypt & Store
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stored Secrets</CardTitle>
              <CardDescription>Your encrypted secrets</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading secrets...</p>
              ) : secrets.length === 0 ? (
                <p className="text-muted-foreground">No secrets stored yet</p>
              ) : (
                <div className="space-y-4">
                  {secrets.map((secret) => (
                    <div key={secret.id} className="rounded-md border p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            Secret ID: {secret.id}
                          </h3>
                          {secret.usePasskey && (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              <Fingerprint className="h-3 w-3 mr-1" />
                              Passkey
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSecret(secret.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>

                      {decryptedSecrets[secret.id] ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="font-mono bg-muted p-2 rounded text-sm flex-1 overflow-x-auto">
                              {showSecret[secret.id]
                                ? decryptedSecrets[secret.id]
                                : "••••••••••••••••"}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleShowSecret(secret.id)}
                              className="h-8 w-8"
                            >
                              {showSecret[secret.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-2">
                          {secret.usePasskey ? (
                            <Button
                              onClick={() => handleDecryptSecret(secret)}
                              className="flex-1 gap-2"
                            >
                              <Fingerprint className="h-4 w-4" />
                              Decrypt with Passkey
                            </Button>
                          ) : (
                            <>
                              <Input
                                type="password"
                                placeholder="Enter password to decrypt"
                                className="flex-1"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleDecryptSecret(
                                      secret,
                                      e.currentTarget.value,
                                    );
                                    e.currentTarget.value = "";
                                  }
                                }}
                              />
                              <Button
                                variant="outline"
                                onClick={(e) => {
                                  const input = e.currentTarget
                                    .previousSibling as HTMLInputElement;
                                  handleDecryptSecret(secret, input.value);
                                  input.value = "";
                                }}
                              >
                                Decrypt
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
