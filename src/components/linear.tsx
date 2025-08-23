import { getMyIssues, createIssue } from "@/linear/action";
import { useEffect, useState } from "react";

export default function Linear() {
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        console.log("fetching issues");
        const res = await getMyIssues();
        setIssues(res);
        await createIssue("test", "set up test framework");
      } catch (error) {
        console.error("Failed to fetch issues:", error);
        // Handle error appropriately
      }
    })();
  }, []);

  return (
    <div>
      {issues.map((issue, index) => (
        <div key={index}>{issue}</div>
      ))}
    </div>
  );
}
