import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n";
import { translateBatch } from "@/lib/translation-api";

const BLOCKED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "OPTION",
]);

function shouldTranslateTextNode(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) return false;
  if (BLOCKED_TAGS.has(parent.tagName)) return false;
  if (parent.closest("[data-no-auto-translate='true']")) return false;
  const text = node.textContent ?? "";
  if (!text.trim()) return false;
  return /[A-Za-z]/.test(text);
}

function withOriginalWhitespace(src: string, translated: string): string {
  const leading = src.match(/^\s*/)?.[0] ?? "";
  const trailing = src.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated.trim()}${trailing}`;
}

function collectTranslatableNodes(root: ParentNode, originals: WeakMap<Text, string>): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    const textNode = current as Text;
    if (shouldTranslateTextNode(textNode)) {
      if (!originals.has(textNode)) {
        originals.set(textNode, textNode.textContent ?? "");
      }
      nodes.push(textNode);
    }
    current = walker.nextNode();
  }
  return nodes;
}

function collectAttributeElements(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      "input[placeholder], textarea[placeholder], [title], [aria-label]",
    ),
  ).filter((el) => !el.closest("[data-no-auto-translate='true']"));
}

export function GlobalAutoTranslate() {
  const { lang } = useLanguage();
  const langRef = useRef<Language>(lang);
  const originalsRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const attrOriginalsRef = useRef<WeakMap<HTMLElement, Record<string, string>>>(new WeakMap());
  const runningRef = useRef(false);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    let timeout: number | null = null;
    const originals = originalsRef.current;
    const attrOriginals = attrOriginalsRef.current;

    const runTranslationPass = async () => {
      if (runningRef.current || cancelled) return;
      runningRef.current = true;
      try {
        const nodes = collectTranslatableNodes(document.body, originals);
        const attrElements = collectAttributeElements();

        if (langRef.current === "en") {
          for (const node of nodes) {
            const original = originals.get(node);
            if (original !== undefined && node.textContent !== original) {
              node.textContent = original;
            }
          }
          for (const el of attrElements) {
            const map = attrOriginals.get(el);
            if (!map) continue;
            for (const [attr, value] of Object.entries(map)) {
              el.setAttribute(attr, value);
            }
          }
          return;
        }

        const uniqueTexts = Array.from(
          new Set(
            nodes
              .map((node) => (originals.get(node) ?? "").trim())
              .filter((value) => value.length > 0),
          ),
        );

        const attrPairs: Array<{ el: HTMLElement; attr: string; value: string }> = [];
        for (const el of attrElements) {
          const attrs = ["placeholder", "title", "aria-label"] as const;
          for (const attr of attrs) {
            const value = el.getAttribute(attr);
            if (!value || !/[A-Za-z]/.test(value)) continue;
            const existing = attrOriginals.get(el) ?? {};
            if (!existing[attr]) {
              existing[attr] = value;
              attrOriginals.set(el, existing);
            }
            attrPairs.push({ el, attr, value: existing[attr] });
          }
        }

        const uniqueAttrTexts = Array.from(new Set(attrPairs.map((p) => p.value.trim()).filter(Boolean)));
        const allTexts = Array.from(new Set([...uniqueTexts, ...uniqueAttrTexts]));
        const translated = await translateBatch(allTexts, langRef.current);

        if (cancelled) return;

        for (const node of nodes) {
          const original = originals.get(node);
          if (!original) continue;
          const translatedCore = translated[original.trim()] ?? original.trim();
          node.textContent = withOriginalWhitespace(original, translatedCore);
        }

        for (const pair of attrPairs) {
          const translatedValue = translated[pair.value.trim()] ?? pair.value;
          pair.el.setAttribute(pair.attr, translatedValue);
        }
      } finally {
        runningRef.current = false;
      }
    };

    const schedule = () => {
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        void runTranslationPass();
      }, 120);
    };

    const observer = new MutationObserver(() => {
      schedule();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });

    schedule();

    return () => {
      cancelled = true;
      observer.disconnect();
      if (timeout) window.clearTimeout(timeout);
    };
  }, [lang]);

  return null;
}
