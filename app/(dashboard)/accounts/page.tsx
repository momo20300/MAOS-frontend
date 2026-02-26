"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAccounts } from "@/lib/services/erpnext";
import {
  Calculator, ChevronRight, ChevronDown, Search, FileSpreadsheet,
} from "lucide-react";

interface Account {
  name: string;
  account_name?: string;
  account_type?: string;
  root_type?: string;
  is_group?: number;
  parent_account?: string;
  balance?: number;
}

interface TreeNode extends Account {
  children: TreeNode[];
  expanded: boolean;
  depth: number;
}

function buildTree(accounts: Account[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Create nodes
  for (const acct of accounts) {
    map.set(acct.name, { ...acct, children: [], expanded: false, depth: 0 });
  }

  // Build hierarchy
  for (const acct of accounts) {
    const node = map.get(acct.name)!;
    if (acct.parent_account && map.has(acct.parent_account)) {
      const parent = map.get(acct.parent_account)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort children alphabetically
  const sortChildren = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (a.account_name || a.name).localeCompare(b.account_name || b.name));
    for (const node of nodes) sortChildren(node.children);
  };
  sortChildren(roots);

  return roots;
}

function TreeRow({
  node,
  onToggle,
}: {
  node: TreeNode;
  onToggle: (name: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const rootTypeColors: Record<string, string> = {
    Asset: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Liability: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    Equity: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    Income: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Expense: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };

  return (
    <>
      <div
        className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
        style={{ paddingLeft: `${node.depth * 24 + 12}px` }}
        onClick={() => hasChildren && onToggle(node.name)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren ? (
            node.expanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <span className={`truncate ${hasChildren ? "font-semibold" : "font-normal"}`}>
            {node.account_name || node.name}
          </span>
          {node.is_group === 1 && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 rounded">
              Groupe
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {node.root_type && (
            <Badge
              variant="secondary"
              className={`text-[10px] h-5 px-1.5 rounded ${rootTypeColors[node.root_type] || ""}`}
            >
              {node.root_type}
            </Badge>
          )}
          {node.account_type && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 rounded">
              {node.account_type}
            </Badge>
          )}
        </div>
      </div>
      {node.expanded &&
        node.children.map((child) => (
          <TreeRow key={child.name} node={child} onToggle={onToggle} />
        ))}
    </>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAccounts();
        setAccounts(data);
        const builtTree = buildTree(data);
        // Auto-expand root nodes
        for (const root of builtTree) root.expanded = true;
        setTree(builtTree);
      } catch (error) {
        console.error("Erreur chargement comptes:", error);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const toggleNode = (name: string) => {
    const toggle = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => ({
        ...n,
        expanded: n.name === name ? !n.expanded : n.expanded,
        children: toggle(n.children),
      }));
    setTree(toggle(tree));
  };

  const expandAll = () => {
    const expandAllNodes = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => ({ ...n, expanded: true, children: expandAllNodes(n.children) }));
    setTree(expandAllNodes(tree));
  };

  const collapseAll = () => {
    const collapseAllNodes = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => ({ ...n, expanded: false, children: collapseAllNodes(n.children) }));
    setTree(collapseAllNodes(tree));
  };

  // Filter: show matching accounts and their ancestors
  const filteredTree = search
    ? accounts.filter(
        (a) =>
          (a.account_name || "").toLowerCase().includes(search.toLowerCase()) ||
          a.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const groups = accounts.filter((a) => a.is_group === 1).length;
  const leaves = accounts.filter((a) => a.is_group !== 1).length;
  const rootTypes = Array.from(new Set(accounts.map((a) => a.root_type).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Chargement du plan comptable...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Plan Comptable</h2>
          <p className="text-muted-foreground">
            Structure hierarchique des comptes ({accounts.length} comptes)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Comptes</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Groupes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comptes Detailles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaves}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Types Racine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 flex-wrap">
              {rootTypes.map((type) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un compte..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll} className="rounded-xl">
            Tout ouvrir
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="rounded-xl">
            Tout fermer
          </Button>
        </div>
      </div>

      {/* Tree View / Search Results */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>
            {search ? `Resultats de recherche (${filteredTree.length})` : "Arborescence des comptes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {search ? (
            <div className="space-y-1">
              {filteredTree.map((account) => (
                <div
                  key={account.name}
                  className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <span className="font-medium">{account.account_name || account.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{account.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.root_type && (
                      <Badge variant="secondary" className="text-[10px]">
                        {account.root_type}
                      </Badge>
                    )}
                    {account.account_type && (
                      <Badge variant="outline" className="text-[10px]">
                        {account.account_type}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              {tree.map((node) => (
                <TreeRow key={node.name} node={node} onToggle={toggleNode} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="text-center py-12">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun compte</h3>
          <p className="text-muted-foreground">Le plan comptable est vide</p>
        </div>
      )}
    </div>
  );
}
