"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import { login, register } from "@/lib/api/endpoints";

type Mode = "login" | "register";

const initialRegister = {
  username: "",
  email: "",
  password: "",
  city: "Strasbourg"
};

const initialLogin = {
  email: "",
  password: ""
};

export function AuthForms() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [mode, setMode] = useState<Mode>("login");
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      setSession(response.access_token, response.user);
      router.push("/feed");
    },
    onError: (mutationError: Error) => setError(mutationError.message)
  });

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (response) => {
      setSession(response.access_token, response.user);
      router.push("/feed");
    },
    onError: (mutationError: Error) => setError(mutationError.message)
  });

  const isBusy = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex rounded-full bg-white/70 p-1 ring-1 ring-borderSoft">
        {(["login", "register"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setMode(tab);
              setError(null);
            }}
            className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
              mode === tab ? "bg-plum text-white" : "text-graphite"
            }`}
          >
            {tab === "login" ? "Connexion" : "Inscription"}
          </button>
        ))}
      </div>

      {mode === "login" ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            loginMutation.mutate(loginForm);
          }}
        >
          <Input
            type="email"
            placeholder="Email"
            value={loginForm.email}
            onChange={(event) =>
              setLoginForm((current) => ({ ...current, email: event.target.value }))
            }
          />
          <Input
            type="password"
            placeholder="Mot de passe"
            value={loginForm.password}
            onChange={(event) =>
              setLoginForm((current) => ({ ...current, password: event.target.value }))
            }
          />
          <Button type="submit" fullWidth disabled={isBusy}>
            Entrer dans LE_LA
          </Button>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            registerMutation.mutate(registerForm);
          }}
        >
          <Input
            placeholder="Nom d'utilisateur"
            value={registerForm.username}
            onChange={(event) =>
              setRegisterForm((current) => ({ ...current, username: event.target.value }))
            }
          />
          <Input
            type="email"
            placeholder="Email"
            value={registerForm.email}
            onChange={(event) =>
              setRegisterForm((current) => ({ ...current, email: event.target.value }))
            }
          />
          <Input
            placeholder="Ville"
            value={registerForm.city}
            onChange={(event) =>
              setRegisterForm((current) => ({ ...current, city: event.target.value }))
            }
          />
          <Input
            type="password"
            placeholder="Mot de passe"
            value={registerForm.password}
            onChange={(event) =>
              setRegisterForm((current) => ({ ...current, password: event.target.value }))
            }
          />
          <Button type="submit" fullWidth disabled={isBusy}>
            Creer mon compte
          </Button>
        </form>
      )}

      {error ? (
        <p className="rounded-3xl bg-[#FDE7E1] px-4 py-3 text-sm text-[#A33F27]">{error}</p>
      ) : null}
    </div>
  );
}

