import { useMemo, useState } from "react";
import { ExternalLink, Star, Clock, BookOpen, Zap, CheckCircle2, Globe, Filter, Search, GitCompareArrows } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  COURSES,
  GRADES,
  SUBJECTS,
  groupComparableBatches,
  bestValueIndex,
  type CourseListing,
} from "@/data/coursesCatalog";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn("w-3 h-3", i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted/40")} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function CourseCard({ course }: { course: CourseListing }) {
  const { t } = useLanguage();

  return (
    <Card className={cn("border transition-all hover:shadow-lg hover:-translate-y-0.5 flex flex-col", course.isAiRecommended && "border-primary/50 shadow-primary/10")}>
      <CardContent className="pt-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", course.providerColor)} />
              <span className="text-xs font-semibold text-muted-foreground">{course.provider}</span>
              {course.isAiRecommended && (
                <Badge className="text-[9px] px-1.5 py-0 bg-primary/15 text-primary border-primary/30 font-semibold">
                  <Zap className="w-2.5 h-2.5 mr-0.5" />{t("aiRecommended")}
                </Badge>
              )}
            </div>
            <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-tight">{course.title}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">
              <span className="font-medium text-foreground/80">{t("batch")}:</span> {course.batchName}
              <span className="mx-1.5 text-border">·</span>
              {course.batchFormat}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            {course.isFree ? (
              <div className="text-emerald-400 font-bold text-sm">{t("freeCourse")}</div>
            ) : (
              <div className="font-bold text-foreground text-sm">
                ₹{course.price.toLocaleString("en-IN")}
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{course.description}</p>

        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{course.durationHours}h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground truncate">{course.language}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{course.level}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">{course.grade}</Badge>
          </div>
        </div>

        <StarRating rating={course.rating} />
        <p className="text-[10px] text-muted-foreground mt-0.5">{course.reviewCount.toLocaleString("en-IN")} reviews</p>

        <div className="mt-3 mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">{t("syllabusMatch")}</span>
            <span className={cn("font-bold", course.syllabusMatch >= 85 ? "text-emerald-400" : course.syllabusMatch >= 70 ? "text-amber-400" : "text-muted-foreground")}>
              {course.syllabusMatch}%
            </span>
          </div>
          <Progress value={course.syllabusMatch} className="h-1.5" />
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {course.syllabusTopics.slice(0, 3).map(topic => (
            <span key={topic} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              {topic}
            </span>
          ))}
          {course.syllabusTopics.length > 3 && (
            <span className="text-[9px] px-1.5 py-0.5 text-muted-foreground">+{course.syllabusTopics.length - 3}</span>
          )}
        </div>

        <div className="mt-auto">
          <a href={course.url} target="_blank" rel="noopener noreferrer">
            <Button className="w-full" size="sm" variant={course.isAiRecommended ? "default" : "outline"}>
              {t("enrollNow")} <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CoursesPage() {
  const { t } = useLanguage();
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedGrade, setSelectedGrade] = useState("All Grades");
  const [search, setSearch] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [compareGroupId, setCompareGroupId] = useState<string | null>(null);

  const filtered = COURSES.filter(c => {
    if (selectedSubject !== "All" && c.subject !== selectedSubject) return false;
    if (selectedGrade !== "All Grades" && c.grade !== selectedGrade) return false;
    if (freeOnly && !c.isFree) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.provider.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const compareGroups = useMemo(() => {
    const raw = groupComparableBatches(COURSES, selectedGrade);
    if (selectedSubject === "All") return raw;
    return raw.filter(g => g.subject === selectedSubject);
  }, [selectedGrade, selectedSubject]);

  const activeCompare = useMemo(() => {
    if (compareGroups.length === 0) return null;
    const pick = compareGroupId && compareGroups.some(g => g.groupId === compareGroupId)
      ? compareGroupId
      : compareGroups[0].groupId;
    return compareGroups.find(g => g.groupId === pick) ?? null;
  }, [compareGroups, compareGroupId]);

  const recommended = filtered.filter(c => c.isAiRecommended);
  const others = filtered.filter(c => !c.isAiRecommended);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("coursesMarketplace")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-curated courses matched to your knowledge gaps
          </p>
        </div>
        <Badge className="self-start sm:self-auto bg-primary/15 text-primary border-primary/30 text-xs px-3 py-1">
          <Zap className="w-3 h-3 mr-1" /> AI-powered matching
        </Badge>
      </div>

      <Card className="border">
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 border border-border">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`${t("search")} courses...`}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              {SUBJECTS.map(s => (
                <button key={s} onClick={() => setSelectedSubject(s)}
                  className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                    selectedSubject === s ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                  )}>
                  {s}
                </button>
              ))}
              <div className="w-px h-4 bg-border" />
              <button onClick={() => setFreeOnly(f => !f)}
                className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1",
                  freeOnly ? "bg-emerald-500 text-white border-emerald-500" : "bg-muted text-muted-foreground border-border"
                )}>
                <CheckCircle2 className="w-3 h-3" /> {t("freeCourse")} only
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {GRADES.map(g => (
                <button key={g} onClick={() => setSelectedGrade(g)}
                  className={cn("px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all",
                    selectedGrade === g ? "bg-secondary text-secondary-foreground border-secondary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                  )}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {compareGroups.length > 0 && activeCompare && (
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-2">
              <GitCompareArrows className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base">{t("batchComparison")}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{t("compareBatchesHint")}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <label className="text-xs font-medium text-muted-foreground shrink-0">{t("courseComparison")}</label>
              <select
                value={activeCompare.groupId}
                onChange={e => setCompareGroupId(e.target.value)}
                className="flex-1 text-sm rounded-md border border-border bg-background px-3 py-2"
              >
                {compareGroups.map(g => (
                  <option key={g.groupId} value={g.groupId}>
                    {g.grade} · {g.subject} — {g.label.slice(0, 48)}{g.label.length > 48 ? "…" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs min-w-[640px]">
                <thead>
                  <tr className="bg-muted/60 text-left border-b border-border">
                    <th className="p-2 font-semibold">{t("batch")}</th>
                    <th className="p-2 font-semibold">{t("formatLabel")}</th>
                    <th className="p-2 font-semibold">{t("price")}</th>
                    <th className="p-2 font-semibold">{t("duration")}</th>
                    <th className="p-2 font-semibold">{t("rating")}</th>
                    <th className="p-2 font-semibold">{t("syllabusMatch")}</th>
                    <th className="p-2 font-semibold w-28" />
                  </tr>
                </thead>
                <tbody>
                  {activeCompare.rows.map((row, i) => {
                    const best = bestValueIndex(activeCompare.rows) === i;
                    return (
                      <tr key={row.id} className={cn("border-b border-border/80", best && "bg-emerald-500/10")}>
                        <td className="p-2">
                          <div className="font-medium text-foreground">{row.batchName}</div>
                          <div className="text-[10px] text-muted-foreground">{row.provider}</div>
                          {best && (
                            <Badge className="mt-1 text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                              {t("bestValue")}
                            </Badge>
                          )}
                        </td>
                        <td className="p-2 text-muted-foreground">{row.batchFormat}</td>
                        <td className="p-2 font-semibold">
                          {row.isFree ? <span className="text-emerald-600">{t("freeCourse")}</span> : `₹${row.price.toLocaleString("en-IN")}`}
                        </td>
                        <td className="p-2">{row.durationHours}h</td>
                        <td className="p-2">{row.rating.toFixed(1)}</td>
                        <td className="p-2">{row.syllabusMatch}%</td>
                        <td className="p-2">
                          <a href={row.url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="h-7 text-[10px] px-2">
                              {t("enrollNow")}
                            </Button>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground">
              “{t("bestValue")}” blends price, hours, rating, and syllabus match — use it as a starting point; pick live vs recorded based on how you learn best.
            </p>
          </CardContent>
        </Card>
      )}

      {recommended.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">{t("aiRecommended")} for You</h2>
            <Badge className="ml-auto text-[10px] bg-primary/10 text-primary border-primary/20">{recommended.length} courses</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">All Courses</h2>
            <Badge variant="outline" className="ml-auto text-[10px]">{others.length} courses</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {others.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground">{t("noData")}</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setSelectedSubject("All"); setSelectedGrade("All Grades"); setSearch(""); setFreeOnly(false); }}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
