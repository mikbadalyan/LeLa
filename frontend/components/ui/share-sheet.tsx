"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { LoaderCircle, SendHorizonal, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store";
import { getFriends, shareEditorial } from "@/lib/api/endpoints";

interface ShareSheetProps {
  editorialId: string;
  editorialTitle: string;
  basePath?: string;
  children: (controls: { open: () => void }) => ReactNode;
}

export function ShareSheet({
  editorialId,
  editorialTitle,
  basePath = "",
  children,
}: ShareSheetProps) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const friendsQuery = useQuery({
    queryKey: ["friends", Boolean(token)],
    queryFn: () => getFriends(token!),
    enabled: open && Boolean(token),
  });

  const shareMutation = useMutation({
    mutationFn: (recipientId: string) =>
      shareEditorial({ editorial_id: editorialId, recipient_id: recipientId }, token!),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["conversation-messages", response.recipient.id],
      });
      setStatusMessage(`Carte envoyee a ${response.recipient.display_name}.`);
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    },
  });

  return (
    <>
      {children({
        open: () => {
          setStatusMessage(null);
          setOpen(true);
        },
      })}

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/35 px-3 py-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[32px] bg-elevated p-5 shadow-card ring-1 ring-borderSoft/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-blue">Partager</p>
                <h3 className="mt-2 text-xl font-semibold text-ink">{editorialTitle}</h3>
                <p className="mt-1 text-sm leading-6 text-graphite">
                  Envoyez cette carte a un ami, comme dans un partage Instagram.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-mist p-2 text-graphite transition hover:bg-borderSoft"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!token ? (
              <div className="mt-5 rounded-[28px] bg-mist px-4 py-5 text-sm text-graphite">
                Connectez-vous pour partager une carte avec vos amis.{" "}
                <Link href={`${basePath}/login`} className="font-semibold text-plum underline">
                  Ouvrir la connexion
                </Link>
              </div>
            ) : friendsQuery.isLoading ? (
              <div className="mt-6 flex items-center justify-center py-8 text-plum">
                <LoaderCircle className="h-6 w-6 animate-spin" />
              </div>
            ) : friendsQuery.data?.length ? (
              <div className="mt-5 space-y-3">
                {friendsQuery.data.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => shareMutation.mutate(friend.id)}
                    disabled={shareMutation.isPending}
                    className="flex w-full items-center justify-between rounded-[24px] bg-surface px-4 py-4 text-left ring-1 ring-borderSoft/10 transition hover:bg-mist"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">{friend.display_name}</p>
                      <p className="text-xs text-graphite/70">
                        @{friend.username} {friend.city ? `· ${friend.city}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-blueSoft p-2 text-blue">
                      <SendHorizonal className="h-4 w-4" />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[28px] bg-mist px-4 py-5 text-sm leading-6 text-graphite">
                Aucun ami disponible pour le moment. Ajoutez des profils dans{" "}
                <Link href={`${basePath}/relations`} className="font-semibold text-plum underline">
                  Relations
                </Link>
                .
              </div>
            )}

            {statusMessage ? (
              <div className="mt-4 rounded-[24px] bg-blueSoft px-4 py-3 text-sm text-blue">
                {statusMessage}
              </div>
            ) : null}

            <div className="mt-5">
              <Button type="button" variant="secondary" fullWidth onClick={() => setOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
