"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

const features = [
  "Free to play",
  "No extra devices",
  "Works offline",
  "No account needed",
  "Multiple game modes",
  "Pass-and-play",
];

const competitors = [
  {
    name: "Sussy",
    highlight: true,
    checks: [true, true, true, true, true, true],
  },
  {
    name: "Jackbox",
    highlight: false,
    checks: [false, false, false, false, true, false],
  },
  {
    name: "Heads Up",
    highlight: false,
    checks: [false, true, false, false, false, true],
  },
  {
    name: "Psych!",
    highlight: false,
    checks: [true, false, false, false, false, false],
  },
];

export function ComparisonTable() {
  return (
    <section className="py-24 px-8">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto"
      >
        <h2 className="text-3xl font-bold text-text-primary text-center mb-3">
          Why Sussy?
        </h2>
        <p className="text-text-secondary text-center mb-10">
          See how we stack up against the competition
        </p>

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-text-secondary font-medium">
                    Feature
                  </th>
                  {competitors.map((c) => (
                    <th
                      key={c.name}
                      className={`p-4 text-center font-bold ${
                        c.highlight ? "text-brand" : "text-text-primary"
                      }`}
                      style={
                        c.highlight
                          ? { backgroundColor: "rgba(139, 92, 246, 0.1)" }
                          : undefined
                      }
                    >
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, fi) => (
                  <tr
                    key={feature}
                    className={
                      fi < features.length - 1 ? "border-b border-border" : ""
                    }
                  >
                    <td className="p-4 text-text-primary">{feature}</td>
                    {competitors.map((c) => (
                      <td
                        key={c.name}
                        className="p-4 text-center text-lg"
                        style={
                          c.highlight
                            ? { backgroundColor: "rgba(139, 92, 246, 0.1)" }
                            : undefined
                        }
                      >
                        {c.checks[fi] ? (
                          <span className="text-success">&#10003;</span>
                        ) : (
                          <span className="text-danger">&#10007;</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </section>
  );
}
