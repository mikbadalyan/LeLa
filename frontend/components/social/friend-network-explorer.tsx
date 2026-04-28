"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Network,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { useI18n } from "@/features/shell/i18n";
import type { FriendGraph, FriendGraphNode } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

type ExplorerVariant = "mobile" | "website";
type VisibilityMode = "all" | "direct" | "extended";

interface FriendNetworkExplorerProps {
  graph?: FriendGraph;
  isLoading?: boolean;
  profileBasePath: "/profile" | "/website/profile";
  variant?: ExplorerVariant;
}

const VIEWPORT = {
  mobile: { width: 640, height: 500 },
  website: { width: 1180, height: 620 },
} as const;

function buildProfileHref(node: FriendGraphNode, basePath: "/profile" | "/website/profile") {
  return node.is_self ? basePath : `${basePath}/${node.id}`;
}

function nodeMatchesQuery(node: FriendGraphNode, query: string) {
  const haystacks = [node.display_name, node.username, node.city ?? "", node.bio ?? ""];
  return haystacks.some((value) => value.toLowerCase().includes(query));
}

function computeLayout(nodes: FriendGraphNode[], variant: ExplorerVariant) {
  const viewport = VIEWPORT[variant];
  const rowsPerLane = variant === "website" ? 6 : 5;
  const rowStep = variant === "website" ? 86 : 78;
  const laneWidth = variant === "website" ? 158 : 132;
  const top = variant === "website" ? 108 : 104;
  const columnGap = variant === "website" ? 300 : 230;
  const selfX = variant === "website" ? 110 : 90;
  const positions = new Map<string, { x: number; y: number }>();
  const selfNode = nodes.find((node) => node.is_self);

  if (selfNode) {
    positions.set(selfNode.id, { x: selfX, y: viewport.height / 2 });
  }

  const grouped = new Map<number, FriendGraphNode[]>();
  for (const node of nodes) {
    if (node.is_self) {
      continue;
    }
    const depthGroup = grouped.get(node.depth) ?? [];
    depthGroup.push(node);
    grouped.set(node.depth, depthGroup);
  }

  let maxX: number = viewport.width;
  for (const depth of [1, 2, 3, 4]) {
    const group = (grouped.get(depth) ?? []).sort((left, right) => {
      if (right.connection_count !== left.connection_count) {
        return right.connection_count - left.connection_count;
      }
      return left.display_name.localeCompare(right.display_name);
    });

    if (!group.length) {
      continue;
    }

    const lanes = Math.max(1, Math.ceil(group.length / rowsPerLane));
    const baseX = selfX + depth * columnGap;

    group.forEach((node, index) => {
      const lane = Math.floor(index / rowsPerLane);
      const row = index % rowsPerLane;
      const laneOffset = (lane - (lanes - 1) / 2) * laneWidth;
      const countInLane = Math.min(rowsPerLane, group.length - lane * rowsPerLane);
      const yOffset = ((rowsPerLane - countInLane) * rowStep) / 2;
      const x = baseX + laneOffset;
      const y = top + yOffset + row * rowStep;
      positions.set(node.id, { x, y });
      maxX = Math.max(maxX, x + 210);
    });
  }

  return { positions, width: maxX, height: viewport.height };
}

function depthMeta(node: FriendGraphNode) {
  if (node.is_self) {
    return { label: "Vous", color: "#3365C8", soft: "rgba(51, 101, 200, 0.12)" };
  }
  if (node.depth === 1) {
    return { label: "Ami direct", color: "#7643A6", soft: "rgba(118, 67, 166, 0.12)" };
  }
  if (node.depth === 2) {
    return { label: "Ami d'ami", color: "#1FA463", soft: "rgba(31, 164, 99, 0.12)" };
  }
  return { label: `Cercle ${node.depth}`, color: "#F2A444", soft: "rgba(242, 164, 68, 0.16)" };
}

function NodeButton({
  node,
  position,
  selected,
  highlighted,
  variant,
  onSelect,
}: {
  node: FriendGraphNode;
  position: { x: number; y: number };
  selected: boolean;
  highlighted: boolean;
  variant: ExplorerVariant;
  onSelect: (nodeId: string) => void;
}) {
  const size =
    node.is_self ? (variant === "website" ? 62 : 56) : node.depth === 1 ? 50 : node.depth === 2 ? 46 : 42;
  const cardWidth = variant === "website" ? 190 : 160;
  const meta = depthMeta(node);

  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className="group absolute z-10 text-left"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -50%)",
      }}
      aria-pressed={selected}
      aria-label={node.display_name}
    >
      <span
        className={cn(
          "pointer-events-none absolute -inset-2 -z-10 rounded-[24px] blur-[10px] transition",
          selected ? "network-node-glow opacity-100" : highlighted ? "opacity-80" : "opacity-40"
        )}
        style={{ backgroundColor: meta.soft }}
      />
      <span
        className={cn(
          "relative flex items-center gap-3 rounded-[22px] border bg-white px-3 py-2 shadow-[0_12px_28px_rgba(45,50,64,0.13)] transition",
          selected ? "scale-[1.03] ring-4 ring-[#3365C8]/15" : "group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_34px_rgba(45,50,64,0.17)]"
        )}
        style={{ width: cardWidth, borderColor: highlighted || selected ? meta.color : "rgba(17,24,39,0.08)" }}
      >
        <span
          className="relative shrink-0 overflow-hidden rounded-full border-[3px] bg-white"
          style={{ width: size, height: size, borderColor: meta.color }}
        >
          <Image
            src={node.avatar_url}
            alt={node.display_name}
            fill
            sizes={`${size}px`}
            className="object-cover"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold leading-tight text-[#111827]">
            {node.display_name}
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-medium text-[#667085]">
            {node.city || `@${node.username}`}
          </span>
          <span className="mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]" style={{ backgroundColor: meta.soft, color: meta.color }}>
            {meta.label}
          </span>
        </span>
      </span>
    </button>
  );
}

export function FriendNetworkExplorer({
  graph,
  isLoading = false,
  profileBasePath,
  variant = "mobile",
}: FriendNetworkExplorerProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [depthLimit, setDepthLimit] = useState(3);
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];
  const queryValue = deferredQuery.trim().toLowerCase();

  const nodesById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes]
  );

  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const edge of edges) {
      map.set(edge.source_id, new Set([...(map.get(edge.source_id) ?? []), edge.target_id]));
      map.set(edge.target_id, new Set([...(map.get(edge.target_id) ?? []), edge.source_id]));
    }
    return map;
  }, [edges]);

  const cityOptions = useMemo(() => {
    return Array.from(
      new Set(nodes.map((node) => node.city).filter((value): value is string => Boolean(value)))
    ).sort((left, right) => left.localeCompare(right));
  }, [nodes]);

  const visibleNodes = useMemo(() => {
    const baseNodes = nodes.filter((node) => {
      if (node.depth > depthLimit) {
        return false;
      }
      if (visibilityMode === "direct" && !node.is_self && node.depth > 1) {
        return false;
      }
      if (visibilityMode === "extended" && !node.is_self && node.depth <= 1) {
        return false;
      }
      if (cityFilter !== "all" && !node.is_self && node.city !== cityFilter) {
        return false;
      }
      return true;
    });

    if (!queryValue) {
      return baseNodes;
    }

    const matchedIds = new Set(baseNodes.filter((node) => nodeMatchesQuery(node, queryValue)).map((node) => node.id));
    const contextualIds = new Set<string>();

    for (const nodeId of matchedIds) {
      contextualIds.add(nodeId);
      adjacency.get(nodeId)?.forEach((linkedId) => contextualIds.add(linkedId));

      let cursor = nodesById.get(nodeId);
      while (cursor?.path_parent_id) {
        contextualIds.add(cursor.path_parent_id);
        cursor = nodesById.get(cursor.path_parent_id);
      }
    }

    return baseNodes.filter((node) => contextualIds.has(node.id) || node.is_self);
  }, [adjacency, cityFilter, depthLimit, nodes, nodesById, queryValue, visibilityMode]);

  const visibleIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);

  const visibleEdges = useMemo(
    () => edges.filter((edge) => visibleIds.has(edge.source_id) && visibleIds.has(edge.target_id)),
    [edges, visibleIds]
  );

  useEffect(() => {
    const selfNode = nodes.find((node) => node.is_self);
    if (!selectedNodeId && selfNode) {
      setSelectedNodeId(selfNode.id);
      return;
    }

    if (selectedNodeId && !visibleIds.has(selectedNodeId)) {
      setSelectedNodeId(selfNode?.id ?? null);
    }
  }, [nodes, selectedNodeId, visibleIds]);

  const selectedNode = selectedNodeId ? nodesById.get(selectedNodeId) ?? null : null;
  const selectedConnections = useMemo(() => {
    if (!selectedNode) {
      return [];
    }
    return Array.from(adjacency.get(selectedNode.id) ?? [])
      .map((nodeId) => nodesById.get(nodeId))
      .filter((node): node is FriendGraphNode => Boolean(node))
      .filter((node) => visibleIds.has(node.id))
      .sort((left, right) => right.connection_count - left.connection_count)
      .slice(0, 8);
  }, [adjacency, nodesById, selectedNode, visibleIds]);

  const selectedChain = useMemo(() => {
    if (!selectedNode) {
      return [];
    }
    const chain: FriendGraphNode[] = [];
    let cursor: FriendGraphNode | undefined | null = selectedNode;
    while (cursor) {
      chain.unshift(cursor);
      cursor = cursor.path_parent_id ? nodesById.get(cursor.path_parent_id) : null;
    }
    return chain;
  }, [nodesById, selectedNode]);

  const layout = useMemo(() => computeLayout(visibleNodes, variant), [variant, visibleNodes]);
  const positions = layout.positions;
  const layerLabels = [
    { depth: 0, label: "Vous", x: variant === "website" ? 110 : 90 },
    { depth: 1, label: "Amis directs", x: (variant === "website" ? 110 : 90) + (variant === "website" ? 300 : 230) },
    { depth: 2, label: "Amis d'amis", x: (variant === "website" ? 110 : 90) + (variant === "website" ? 600 : 460) },
    { depth: 3, label: "3e cercle", x: (variant === "website" ? 110 : 90) + (variant === "website" ? 900 : 690) },
  ];

  const highlightedIds = useMemo(() => {
    const ids = new Set<string>();
    if (queryValue) {
      visibleNodes.forEach((node) => {
        if (nodeMatchesQuery(node, queryValue)) {
          ids.add(node.id);
        }
      });
    }
    if (selectedNode) {
      ids.add(selectedNode.id);
      selectedConnections.forEach((node) => ids.add(node.id));
      selectedChain.forEach((node) => ids.add(node.id));
    }
    return ids;
  }, [queryValue, selectedChain, selectedConnections, selectedNode, visibleNodes]);

  const graphBody = (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3365C8]">
            <Network className="h-3.5 w-3.5" />
            {t("relations.network")}
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5B6374]">
            {t("relations.networkHint")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#172033] shadow-sm ring-1 ring-black/8">
            {t("relations.visible")} {visibleNodes.length}
          </span>
          <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#172033] shadow-sm ring-1 ring-black/8">
            {t("relations.directCount")} {nodes.filter((node) => node.is_direct_friend).length}
          </span>
          <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#172033] shadow-sm ring-1 ring-black/8">
            {t("relations.extendedCount")} {Math.max(0, nodes.length - 1)}
          </span>
          {graph?.truncated ? (
            <span className="rounded-full bg-[#7643A6] px-3 py-2 text-xs font-semibold text-white">
              {t("relations.truncated")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_140px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687083]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("relations.searchGraph")}
            className="border-black/8 bg-white pl-10 text-[#172033] shadow-none ring-1 ring-black/8 placeholder:text-[#8B93A3]"
          />
        </div>

        <div className="flex items-center gap-2 rounded-[18px] bg-[#EEF1F6] p-1">
          {(["all", "direct", "extended"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setVisibilityMode(mode)}
              className={cn(
                "flex-1 rounded-[14px] px-3 py-2 text-xs font-semibold transition",
                visibilityMode === mode ? "bg-white text-[#111827] shadow-sm" : "text-[#687083] hover:bg-white/60"
              )}
            >
              {mode === "all"
                ? t("relations.modeAll")
                : mode === "direct"
                  ? t("relations.modeDirect")
                  : t("relations.modeExtended")}
            </button>
          ))}
        </div>

        <select
          value={cityFilter}
          onChange={(event) => setCityFilter(event.target.value)}
          className="rounded-[18px] border border-black/8 bg-white px-4 py-3 text-sm text-[#172033] outline-none"
        >
          <option value="all">{t("relations.allCities")}</option>
          {cityOptions.map((city) => (
            <option key={city} value={city} className="text-black">
              {city}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[1, 2, 3].map((depth) => (
          <button
            key={depth}
            type="button"
            onClick={() => setDepthLimit(depth)}
            className={cn(
              "rounded-full px-3 py-2 text-xs font-semibold transition",
              depthLimit === depth ? "bg-[#3365C8] text-white shadow-blue" : "bg-white text-[#687083] ring-1 ring-black/8 hover:bg-[#F7F8FA]"
            )}
          >
            {depth === 1 ? t("relations.depth1") : depth === 2 ? t("relations.depth2") : t("relations.depth3")}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setCityFilter("all");
            setDepthLimit(3);
            setVisibilityMode("all");
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#687083] ring-1 ring-black/8 transition hover:bg-[#F7F8FA]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("relations.reset")}
        </button>
      </div>

      <div className="rounded-[28px] border border-black/8 bg-white p-3 shadow-[0_18px_48px_rgba(45,50,64,0.12)]">
        <div
          className={cn(
            "relative overflow-hidden rounded-[22px] border border-black/8 bg-[#F7F8FA]",
            variant === "website" ? "h-[600px]" : "h-[500px]"
          )}
        >
          <div
            className="absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                "linear-gradient(rgba(23,32,51,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(23,32,51,0.045) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(51,101,200,0.09),transparent_46%)]" />
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((current) => Math.max(0.8, Number((current - 0.12).toFixed(2))))}
              className="rounded-full bg-white p-2 text-[#172033] shadow-sm ring-1 ring-black/8 transition hover:bg-[#F7F8FA]"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((current) => Math.min(1.8, Number((current + 0.12).toFixed(2))))}
              className="rounded-full bg-white p-2 text-[#172033] shadow-sm ring-1 ring-black/8 transition hover:bg-[#F7F8FA]"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="rounded-full bg-white p-2 text-[#172033] shadow-sm ring-1 ring-black/8 transition hover:bg-[#F7F8FA]"
              aria-label={t("relations.recenter")}
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>

          {visibleNodes.length ? (
            <div
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              onPointerDown={(event) => {
                dragRef.current = {
                  x: event.clientX,
                  y: event.clientY,
                  panX: pan.x,
                  panY: pan.y,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!dragRef.current) {
                  return;
                }
                setPan({
                  x: dragRef.current.panX + (event.clientX - dragRef.current.x),
                  y: dragRef.current.panY + (event.clientY - dragRef.current.y),
                });
              }}
              onPointerUp={(event) => {
                dragRef.current = null;
                event.currentTarget.releasePointerCapture(event.pointerId);
              }}
              onPointerLeave={() => {
                dragRef.current = null;
              }}
              onWheel={(event) => {
                event.preventDefault();
                setZoom((current) => {
                  const next = current + (event.deltaY < 0 ? 0.08 : -0.08);
                  return Math.max(0.8, Math.min(1.8, Number(next.toFixed(2))));
                });
              }}
            >
              <div
                className="absolute left-0 top-0 origin-top-left transition-transform duration-150"
                style={{
                  width: `${layout.width}px`,
                  height: `${layout.height}px`,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                }}
              >
                {layerLabels.map((layer) => (
                  <div
                    key={layer.depth}
                    className="absolute top-5 -translate-x-1/2 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5B6374] shadow-sm ring-1 ring-black/8"
                    style={{ left: layer.x }}
                  >
                    {layer.label}
                  </div>
                ))}
                <svg
                  viewBox={`0 0 ${layout.width} ${layout.height}`}
                  className="absolute inset-0 h-full w-full"
                  preserveAspectRatio="none"
                >
                  {visibleEdges.map((edge) => {
                    const source = positions.get(edge.source_id);
                    const target = positions.get(edge.target_id);
                    if (!source || !target) {
                      return null;
                    }
                    const active =
                      selectedNode &&
                      (edge.source_id === selectedNode.id || edge.target_id === selectedNode.id);
                    const chain =
                      selectedNode &&
                      selectedChain.some((node) => node.id === edge.source_id) &&
                      selectedChain.some((node) => node.id === edge.target_id);
                    return (
                      <path
                        key={`${edge.source_id}-${edge.target_id}`}
                        d={`M ${source.x} ${source.y} C ${(source.x + target.x) / 2} ${source.y}, ${(source.x + target.x) / 2} ${target.y}, ${target.x} ${target.y}`}
                        className={cn(active ? "network-edge-active" : "", "transition")}
                        stroke={
                          chain
                            ? "rgba(51, 101, 200, 0.95)"
                            : active
                              ? "rgba(118, 67, 166, 0.88)"
                              : "rgba(51, 65, 85, 0.22)"
                        }
                        strokeWidth={chain ? 4 : active ? 3.2 : 1.8}
                        strokeLinecap="round"
                        fill="none"
                      />
                    );
                  })}
                </svg>

                {visibleNodes.map((node) => {
                  const position = positions.get(node.id);
                  if (!position) {
                    return null;
                  }
                  return (
                    <NodeButton
                      key={node.id}
                      node={node}
                      position={position}
                      selected={selectedNode?.id === node.id}
                      highlighted={highlightedIds.has(node.id)}
                      variant={variant}
                      onSelect={setSelectedNodeId}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-[#687083]">
              {t("relations.networkEmpty")}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const infoPanel = (
    <div className="rounded-[28px] border border-white/8 bg-white/96 p-4 text-[#111827] shadow-[0_22px_60px_rgba(12,16,24,0.12)]">
      {selectedNode ? (
        <>
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-[#E9E9E9]">
              <Image src={selectedNode.avatar_url} alt={selectedNode.display_name} fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{selectedNode.display_name}</p>
              <p className="truncate text-sm text-[#4B5563]">@{selectedNode.username}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedNode.is_self ? (
                  <span className="rounded-full bg-[#3365C8]/12 px-2.5 py-1 text-[11px] font-semibold text-[#3365C8]">
                    Vous
                  </span>
                ) : null}
                {selectedNode.is_direct_friend ? (
                  <span className="rounded-full bg-[#7643A6]/12 px-2.5 py-1 text-[11px] font-semibold text-[#7643A6]">
                    {t("relations.friend")}
                  </span>
                ) : null}
                <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-[#374151]">
                  {selectedNode.depth === 0 ? "Centre" : `${selectedNode.depth} hop`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[18px] bg-[#F4F6FB] px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
                {t("relations.connections")}
              </p>
              <p className="mt-1 text-lg font-semibold text-[#111827]">{selectedNode.connection_count}</p>
            </div>
            <div className="rounded-[18px] bg-[#F4F6FB] px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
                {t("relations.mutual")}
              </p>
              <p className="mt-1 text-lg font-semibold text-[#111827]">{selectedNode.mutual_count}</p>
            </div>
          </div>

          {selectedNode.city ? (
            <div className="mt-4 flex items-center gap-2 rounded-[18px] bg-[#F8F8F8] px-3 py-3 text-sm text-[#374151]">
              <MapPin className="h-4 w-4 text-[#7643A6]" />
              <span>{selectedNode.city}</span>
            </div>
          ) : null}

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
              {t("relations.chain")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedChain.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    node.id === selectedNode.id
                      ? "bg-[#3365C8] text-white"
                      : "bg-[#EFF3FF] text-[#3365C8] hover:bg-[#dbeafe]"
                  )}
                >
                  {node.display_name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
              {t("relations.connections")}
            </p>
            <div className="mt-2 space-y-2">
              {selectedConnections.length ? (
                selectedConnections.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedNodeId(node.id)}
                    className="flex w-full items-center gap-3 rounded-[16px] bg-[#F8F8F8] px-3 py-3 text-left transition hover:bg-[#F1F1F1]"
                  >
                    <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[#E9E9E9]">
                      <Image src={node.avatar_url} alt={node.display_name} fill sizes="40px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#111827]">{node.display_name}</p>
                      <p className="truncate text-xs text-[#6B7280]">
                        {node.city || `@${node.username}`}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[#374151]">
                      {node.connection_count}
                    </span>
                  </button>
                ))
              ) : (
                <div className="rounded-[16px] bg-[#F8F8F8] px-3 py-3 text-sm text-[#6B7280]">
                  {t("relations.networkEmpty")}
                </div>
              )}
            </div>
          </div>

          <Link
            href={buildProfileHref(selectedNode, profileBasePath)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#7643A6] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(118,67,166,0.24)]"
          >
            <Users className="h-4 w-4" />
            Voir le profil
          </Link>
        </>
      ) : (
        <div className="flex min-h-[280px] items-center justify-center text-sm text-[#6B7280]">
          {t("relations.networkEmpty")}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="rounded-[28px] border border-borderSoft/10 bg-elevated p-5 shadow-card">
        <div className="h-[420px] animate-pulse rounded-[24px] bg-mist" />
      </div>
    );
  }

  if (!graph || !graph.nodes.length) {
    return (
      <div className="rounded-[28px] border border-borderSoft/10 bg-elevated p-5 text-sm text-graphite shadow-card">
        {t("relations.networkEmpty")}
      </div>
    );
  }

  return variant === "website" ? (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-[32px] bg-[#EEF1F6] p-5 shadow-[0_24px_70px_rgba(45,50,64,0.12)] ring-1 ring-black/8">
        {graphBody}
      </div>
      {infoPanel}
    </div>
  ) : (
    <div className="space-y-4">
      <div className="rounded-[30px] bg-[#EEF1F6] p-4 shadow-[0_22px_54px_rgba(45,50,64,0.12)] ring-1 ring-black/8">
        {graphBody}
      </div>
      {infoPanel}
    </div>
  );
}
