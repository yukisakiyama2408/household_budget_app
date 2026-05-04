import Link from "next/link";

type Tab = { key: string; label: string };

type Props = {
  tabs: Tab[];
  currentTab: string;
  basePath: string;
  preserveParams?: Record<string, string>;
};

export default function PageTabs({ tabs, currentTab, basePath, preserveParams = {} }: Props) {
  return (
    <div className="flex border-b">
      {tabs.map((tab) => {
        const params = new URLSearchParams(preserveParams);
        if (tab.key !== tabs[0].key) {
          params.set("tab", tab.key);
        }
        const href = params.toString() ? `${basePath}?${params}` : basePath;
        return (
          <Link
            key={tab.key}
            href={href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              currentTab === tab.key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
