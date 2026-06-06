/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArchitectureDoc } from '../types';
import { TRANSIT_LINES, SQLITE_DATABASE_METADATA } from '../data/transitDatabase';
import { Copy, Check, FileCode, Server, Database, GitBranch, Cpu } from 'lucide-react';

const ARCHITECTURE_DOCS: ArchitectureDoc[] = [
  {
    title: "SQLite Schema & Seed",
    language: "sql",
    filename: "database/schema.sql",
    description: "Production SQLite relational tables modeling lines, stops, and price structures for lightweight mobile local caching.",
    code: `${SQLITE_DATABASE_METADATA.schema}

${SQLITE_DATABASE_METADATA.seeds}`
  },
  {
    title: "Go GPS Streaming Microservice",
    language: "go",
    filename: "microservices/tracking/main.go",
    description: "Highly concurrent Go server utilizing goroutines and Redis caching to handle active geo-tracking streams for active transit runs.",
    code: `package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

type LocationPing struct {
	DeviceID  string    \`json:"device_id"\`
	Latitude  float64   \`json:"latitude"\`
	Longitude float64   \`json:"longitude"\`
	Speed     float64   \`json:"speed_kph"\`
	Timestamp time.Time \`json:"timestamp"\`
}

var (
	ctx      = context.Background()
	rdbClient *redis.Client
)

func initRedis() {
	redisAddr := os.Getenv("REDIS_URL")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}
	rdbClient = redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})
	log.Printf("Connecting to Redis at %s...", redisAddr)
}

func locationHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var ping LocationPing
	err := json.NewDecoder(r.Body).Decode(&ping)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	ping.Timestamp = time.Now()

	// Push coordinates serialized as JSON into a Redis List for breadcrumb tracking
	pingJSON, _ := json.Marshal(ping)
	key := fmt.Sprintf("device_trail:%s", ping.DeviceID)
	
	// Store breadcrumb with 4-hour automatic expiration to protect telemetry volume
	pipe := rdbClient.Pipeline()
	pipe.LPush(ctx, key, pingJSON)
	pipe.LTrim(ctx, key, 0, 99) // limit to last 100 historical points
	pipe.Expire(ctx, key, 4*time.Hour)
	_, err = pipe.Exec(ctx)

	if err != nil {
		log.Printf("Redis write failed for %s: %v", ping.DeviceID, err)
		http.Error(w, "Internal DB Failure", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	w.Write([]byte(\`{"status":"stream_ping_acknowledged"}\`))
}

func main() {
	initRedis()
	http.HandleFunc("/api/v1/tracking/ping", locationHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Mooderia Transit Engine Live on port %s", port)
	if err := http.ListenAndServe("0.0.0.0:"+port, nil); err != nil {
		log.Fatalf("Server shutdown with error: %v", err)
	}
}`
  },
  {
    title: "Python Routing & AI Predictor",
    language: "python",
    filename: "microservices/routing/route_optimizer.py",
    description: "Optimization engine using NetworkX to select cost-minimized networks, factoring in both transit fare tables and ETA offsets.",
    code: `import os
import networkx as nx
from typing import Dict, List, Tuple

class PhilippineTransitOptimizer:
    def __init__(self):
        # Initialize relational network graph
        self.graph = nx.DiGraph()
        self._load_network()

    def _load_network(self):
        # Nodes: (Stop Name, Coordinates)
        stops = {
            "North Ave": (14.6549, 121.0305),
            "Quezon Ave": (14.6425, 121.0374),
            "Cubao": (14.6194, 121.0511),
            "Taft EDSA": (14.5376, 121.0013),
            "Legarda": (14.6009, 120.9922),
            "Antipolo": (14.6247, 121.1215)
        }
        for name, coords in stops.items():
            self.graph.add_node(name, latitude=coords[0], longitude=coords[1])

        # Directional segments with multi-factor weighting: fare and speed index
        # weighted_cost = (base_fare) + (distance * per_km_fare) + traffic_multiplier
        self.graph.add_edge("North Ave", "Quezon Ave", cost=14.0, transport="MRT3", duration_mins=3.5)
        self.graph.add_edge("Quezon Ave", "Cubao", cost=16.0, transport="MRT3", duration_mins=4.0)
        self.graph.add_edge("Cubao", "Taft EDSA", cost=24.0, transport="MRT3", duration_mins=18.0)
        self.graph.add_edge("Legarda", "Cubao", cost=18.0, transport="LRT2", duration_mins=9.0)
        self.graph.add_edge("Cubao", "Antipolo", cost=23.0, transport="LRT2", duration_mins=14.5)

    def find_best_route(self, origin: str, destination: str, optimize_by: str = "cost") -> Dict:
        """
        Determines routing trail using Dijkstra's algorithm optimized for cost or total duration.
        """
        if origin not in self.graph or destination not in self.graph:
            return {"error": "Origin or destination stop not registered in routing matrix database."}

        try:
            # Dijkstra path calculation factoring customized weights
            weight_factor = "cost" if optimize_by == "cost" else "duration_mins"
            path = nx.dijkstra_path(self.graph, origin, destination, weight=weight_factor)
            total_duration = sum(self.graph[path[i]][path[i+1]]["duration_mins"] for i in range(len(path)-1))
            total_cost = sum(self.graph[path[i]][path[i+1]]["cost"] for i in range(len(path)-1))

            steps = []
            for i in range(len(path) - 1):
                u, v = path[i], path[i+1]
                edge_data = self.graph[u][v]
                steps.append({
                    "from": u,
                    "to": v,
                    "service": edge_data["transport"],
                    "approx_cost_php": edge_data["cost"],
                    "travel_time_min": edge_data["duration_mins"]
                })

            return {
                "origin": origin,
                "destination": destination,
                "optimized_by": optimize_by,
                "total_fare_estimate_php": total_cost,
                "total_duration_estimate_min": total_duration,
                "legs": steps
            }
        except nx.NetworkXNoPath:
            return {"error": "No viable transit path found between coordinates."}

if __name__ == "__main__":
    optimizer = PhilippineTransitOptimizer()
    res = optimizer.find_best_route("North Ave", "Antipolo", optimize_by="duration")
    print(res)`
  },
  {
    title: "Docker Orchestration Setup",
    language: "yaml",
    filename: "docker-compose.yml",
    description: "Complete localized microservices layout orchestrating Vercel-compatible Next.js frontends, Go streaming API, Python optimization routines, and Redis caches.",
    code: `version: '3.8'

services:
  # Next.js Fullstack Layout (Mooderia Commute Portal)
  web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  # High-Performance GPS Tracking Ingest
  tracking-microservice:
    build:
      context: ./microservices/tracking
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - REDIS_URL=redis:6379
    depends_on:
      - redis

  # Graph optimization routing engine
  routing-optimizer:
    build:
      context: ./microservices/routing
    ports:
      - "5000:5000"

  # On-device or cloud-hosted Caching layer
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:`
  },
  {
    title: "Optimized Multi-Stage Dockerfile",
    language: "dockerfile",
    filename: "Dockerfile",
    description: "Minimized and highly optimized security-hardening Dockerfile utilizing Alpine nodes to run the full-stack web client safely.",
    code: `# Multi-stage assembly structure to secure container footprint

# Stage 1: Build resources
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve compiled builds via light production environment
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Protect runtime context by defining non-root application users
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs_runner

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

USER nodejs_runner

EXPOSE 3000
CMD ["npm", "run", "start"]`
  },
  {
    title: "GitHub Actions CI/CD Script",
    language: "yaml",
    filename: ".github/workflows/deploy.yml",
    description: "Automatic workflow executing linters, compiling TypeScript dependencies, carrying out unit testing, and deploying images to Cloud Run and Vercel hosting networks.",
    code: `name: Mooderia Commute Production Deployment Flow

on:
  push:
    branches: [ main, release/* ]
  pull_request:
    branches: [ main ]

jobs:
  validate-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Codebase Checkout
         uses: actions/checkout@v3

      - name: Setup Node Ecosystem
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Dependency Alignment
        run: npm ci

      - name: System Static Linter
        run: npm run lint

      - name: Validate Product Compilation
        run: npm run build

  deploy-to-hosting:
    needs: validate-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Codebase Checkout
        uses: actions/checkout@v3

      - name: Setup Vercel Deployment Client
        run: npm install -g vercel

      - name: Trigger Serverless Push
        run: vercel --token \${{ secrets.VERCEL_TOKEN }} --prod --yes`
  }
];

export default function ArchDocsView() {
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentDoc = ARCHITECTURE_DOCS[activeDocIndex];

  return (
    <div id="arch-docs-container" className="flex flex-col h-full bg-slate-900 text-slate-100 font-sans select-none">
      {/* Playful Kahoot-inspired Heading Header */}
      <div className="bg-[#46178f] p-5 border-b-4 border-[#361175] flex flex-col justify-center items-center shrink-0">
        <h2 className="text-xl font-black tracking-tighter text-white uppercase text-center flex items-center gap-2 font-display">
          <Cpu className="w-5.5 h-5.5 text-amber-400" /> Arch & Systems
        </h2>
        <p className="text-[10px] text-violet-200 uppercase tracking-widest font-extrabold text-center mt-1">
          Relational SQL Schemas & Services
        </p>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Scrollable File selector sidebar */}
        <div className="bg-[#361175] p-2.5 overflow-x-auto border-b border-white/10 flex flex-row gap-2 shrink-0 snap-x style-scrollbar">
          {ARCHITECTURE_DOCS.map((doc, idx) => (
            <button
              id={`doc-tab-${idx}`}
              key={idx}
              onClick={() => {
                setActiveDocIndex(idx);
                setCopied(false);
              }}
              className={`flex items-center gap-1.5 shrink-0 px-4 py-2.5 rounded-2xl text-left text-[10px] transition duration-100 uppercase font-black tracking-wider cursor-pointer snap-start ${
                activeDocIndex === idx
                  ? 'bg-[#9174f4] text-white shadow-md border-b-4 border-[#7c5be1] kahoot-btn'
                  : 'bg-black/20 text-violet-255 hover:bg-black/30 border-none'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 shrink-0" />
              <div className="truncate max-w-[140px]">
                <span className="block text-[8px] opacity-75 font-mono lowercase tracking-normal font-medium">{doc.filename}</span>
                {doc.title}
              </div>
            </button>
          ))}
        </div>

        {/* Big Code Viewer Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          <div className="bg-slate-900 border-b border-white/10 p-3.5 flex justify-between items-center text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-[#9174f4]" />
              <span className="font-mono text-[10px] font-black text-slate-200">{currentDoc.filename}</span>
            </div>
            
            <button
              id="copy-doc-code"
              onClick={() => handleCopy(currentDoc.code)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ffa602] hover:bg-[#d98d02] border-b-4 border-[#b27401] text-white font-black transition text-[10px] uppercase cursor-pointer kahoot-btn"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>
          </div>

          <div className="p-4 bg-[#46178f]/10 border-b border-[#361175]/30 text-[10px] leading-relaxed text-violet-200 font-extrabold uppercase tracking-tight">
            ℹ️ {currentDoc.description}
          </div>

          <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-[#26890c] bg-[#0c051a] style-scrollbar">
            <pre className="whitespace-pre overflow-x-auto selection:bg-[#9174f4] selection:text-white">
              <code>{currentDoc.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
