# @project-bot/shared-flow

Shared React Flow utilities and components for flow-based applications.

## 📦 Installation

```bash
pnpm add @project-bot/shared-flow@workspace:*
```

## 🎯 Purpose

Provide reusable React Flow logic, custom nodes, and utilities used across flow-modeling apps (primarily `admin-app`).

## ✨ Exports

### Custom Nodes

Reusable node components for React Flow.

```typescript
import { QuestionNode, AnswerNode } from "@project-bot/shared-flow";

const nodeTypes = {
  question: QuestionNode,
  answer: AnswerNode,
};
```

### Utilities

Helper functions for flow manipulation.

```typescript
import {
  layoutNodes,
  calculateEdgeIntersection,
} from "@project-bot/shared-flow";

const arrangedNodes = layoutNodes(nodes, edges);
```

## 🧪 Usage

```typescript
// apps/admin-app/src/FlowModeler.jsx
import { layoutNodes } from "@project-bot/shared-flow";
import { useCallback } from "react";

const onLayout = useCallback(() => {
  const layouted = layoutNodes(nodes, edges);
  setNodes(layouted);
}, [nodes, edges]);
```

## 📖 Related Documentation

- [React Flow Documentation](https://reactflow.dev/)
- [ARCHITECTURE.md](file:///c:/xampp/htdocs/Project%20Bot/ARCHITECTURE.md)

---

**For AI Agents**: Shared React Flow utilities. Main export: `index.ts`. Depends on `reactflow@^11`. Used primarily by admin-app for flow modeling functionality.
