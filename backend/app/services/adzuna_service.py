"""Adzuna API Service — Primary Labour Market Intelligence Client.

Implements all 8 official Adzuna endpoints with async httpx requests,
Redis/in-memory caching to preserve the 1,000 requests/month quota,
district-level scoping, and resilient fallback handling.
"""

import hashlib
import logging
from typing import Any

import httpx

from app.core.config import get_settings
from app.schemas.job import (
    AdzunaCategory,
    AdzunaCompany,
    AdzunaJobItem,
    AdzunaLocation,
    GeodataLocationItem,
    GeodataResponse,
    JobCategoriesResponse,
    JobCategoryItem,
    JobSearchResponse,
    SalaryHistogramBand,
    SalaryHistogramResponse,
    SalaryHistoryPoint,
    SalaryHistoryResponse,
    SalaryPredictionResponse,
    TopCompaniesResponse,
    TopCompanyItem,
)
from app.services.cache_service import cache_service

logger = logging.getLogger(__name__)
settings = get_settings()


class AdzunaService:
    """Official Adzuna Jobs API client with caching, error resilience, and realistic fallbacks."""

    def __init__(self):
        self.base_url = f"{settings.ADZUNA_BASE_URL.rstrip('/')}/{settings.ADZUNA_COUNTRY}"
        self.app_id = settings.ADZUNA_APP_ID
        self.app_key = settings.ADZUNA_APP_KEY
        self.timeout = settings.ADZUNA_TIMEOUT_SECONDS
        self.cache_ttl = settings.ADZUNA_CACHE_TTL_SECONDS

    @property
    def is_configured(self) -> bool:
        """Check if real Adzuna credentials are set."""
        return bool(self.app_id and self.app_key and self.app_id.strip() and self.app_key.strip())

    def _build_cache_key(self, endpoint: str, params: dict[str, Any]) -> str:
        """Generate consistent cache key for query."""
        sorted_params = "&".join(f"{k}={v}" for k, v in sorted(params.items()) if v is not None)
        hash_digest = hashlib.md5(f"{endpoint}:{sorted_params}".encode()).hexdigest()
        return f"adzuna:{endpoint}:{hash_digest}"

    async def _make_request(self, endpoint: str, params: dict[str, Any]) -> dict[str, Any] | None:
        """Make HTTP GET request to Adzuna API with timeout and error handling."""
        if not self.is_configured:
            logger.info("Adzuna API credentials not configured, proceeding to fallback.")
            return None

        # Build full query params with auth
        query_params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "content-type": "application/json",
        }
        for k, v in params.items():
            if v is not None:
                query_params[k] = str(v)

        url = f"{self.base_url}/{endpoint.lstrip('/')}"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=query_params)
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 429:
                    logger.warning("Adzuna API quota exceeded / rate limited (429).")
                elif response.status_code in (401, 403):
                    logger.error("Adzuna API authentication failed (status %s). Check ADZUNA_APP_ID and ADZUNA_APP_KEY.", response.status_code)
                else:
                    logger.warning("Adzuna API returned status %s for %s", response.status_code, endpoint)
        except httpx.RequestError as exc:
            logger.warning("Adzuna API request error for %s: %s", endpoint, exc)
        except Exception as exc:
            logger.error("Unexpected error contacting Adzuna API: %s", exc)

        return None

    # =========================================================================
    # 1. Search — /jobs/{country}/search/{page}
    # =========================================================================
    async def search_jobs(
        self,
        what: str | None = None,
        where: str | None = None,
        page: int = 1,
        results_per_page: int = 20,
        what_exclude: str | None = None,
        salary_min: float | None = None,
        full_time: int | None = None,
        permanent: int | None = None,
        sort_by: str | None = None,
    ) -> JobSearchResponse:
        """Search live job advertisement listings with district-scoping via `where` free-text param."""
        cache_key = self._build_cache_key(
            f"search/{page}",
            {
                "what": what,
                "where": where,
                "rpp": results_per_page,
                "exc": what_exclude,
                "smin": salary_min,
                "ft": full_time,
                "perm": permanent,
                "sort": sort_by,
            },
        )

        cached_data = await cache_service.get(cache_key)
        if cached_data:
            cached_data["cached"] = True
            return JobSearchResponse(**cached_data)

        raw_params = {
            "what": what,
            "where": where,
            "results_per_page": results_per_page,
            "what_exclude": what_exclude,
            "salary_min": salary_min,
            "full_time": full_time,
            "permanent": permanent,
            "sort_by": sort_by,
        }

        raw_response = await self._make_request(f"search/{page}", raw_params)

        if raw_response and "results" in raw_response:
            results_list = []
            for item in raw_response.get("results", []):
                loc_dict = item.get("location", {})
                company_dict = item.get("company", {})
                cat_dict = item.get("category", {})

                results_list.append(
                    AdzunaJobItem(
                        id=str(item.get("id", "")),
                        title=item.get("title", "Job Opening"),
                        description=item.get("description"),
                        company=AdzunaCompany(display_name=company_dict.get("display_name")),
                        location=AdzunaLocation(
                            area=loc_dict.get("area", []),
                            display_name=loc_dict.get("display_name"),
                        ),
                        latitude=item.get("latitude"),
                        longitude=item.get("longitude"),
                        salary_min=item.get("salary_min"),
                        salary_max=item.get("salary_max"),
                        salary_is_predicted=item.get("salary_is_predicted", 0),
                        category=AdzunaCategory(
                            label=cat_dict.get("label"),
                            tag=cat_dict.get("tag"),
                        ),
                        contract_type=item.get("contract_type"),
                        contract_time=item.get("contract_time"),
                        created=item.get("created"),
                        redirect_url=item.get("redirect_url"),
                    )
                )

            total_count = raw_response.get("count", len(results_list))
            response_obj = JobSearchResponse(
                results=results_list,
                total_count=total_count,
                page=page,
                results_per_page=results_per_page,
                query_what=what,
                query_where=where,
                data_source="adzuna",
                is_fallback=False,
                cached=False,
            )
            await cache_service.set(cache_key, response_obj.model_dump(), ttl_seconds=self.cache_ttl)
            return response_obj

        # Return mock / realistic simulation when API is unconfigured or unavailable
        return self._generate_simulated_search_response(what, where, page, results_per_page)

    # =========================================================================
    # 2. Regional data (geodata) — /jobs/{country}/geodata
    # =========================================================================
    async def get_geodata(
        self,
        locations: list[str] | None = None,
        category: str | None = None,
    ) -> GeodataResponse:
        """Query regional vacancy counts and walk down location hierarchy."""
        locations = locations or ["India", "Maharashtra"]
        params: dict[str, Any] = {}
        for i, loc in enumerate(locations):
            params[f"location{i}"] = loc
        if category:
            params["category"] = category

        cache_key = self._build_cache_key("geodata", params)
        cached_data = await cache_service.get(cache_key)
        if cached_data:
            cached_data["cached"] = True
            return GeodataResponse(**cached_data)

        raw_response = await self._make_request("geodata", params)

        if raw_response and "locations" in raw_response:
            loc_items = []
            for item in raw_response.get("locations", []):
                loc_dict = item.get("location", {})
                loc_items.append(
                    GeodataLocationItem(
                        count=item.get("count", 0),
                        location=AdzunaLocation(
                            area=loc_dict.get("area", []),
                            display_name=loc_dict.get("display_name"),
                        ),
                    )
                )

            resp = GeodataResponse(
                locations=loc_items,
                level=len(locations),
                parent_location=locations[-1] if locations else "India",
                data_source="adzuna",
                cached=False,
                has_district_depth=len(loc_items) > 0,
            )
            await cache_service.set(cache_key, resp.model_dump(), ttl_seconds=self.cache_ttl)
            return resp

        # Fallback simulation
        return self._generate_simulated_geodata(locations)

    # =========================================================================
    # 3. Historical data — /jobs/{country}/history
    # =========================================================================
    async def get_salary_history(
        self,
        locations: list[str] | None = None,
        category: str | None = None,
        what: str | None = None,
    ) -> SalaryHistoryResponse:
        """Average salary over time by location / category."""
        locations = locations or ["India", "Maharashtra"]
        params: dict[str, Any] = {}
        for i, loc in enumerate(locations):
            params[f"location{i}"] = loc
        if category:
            params["category"] = category

        cache_key = self._build_cache_key("history", params)
        cached_data = await cache_service.get(cache_key)
        if cached_data:
            cached_data["cached"] = True
            return SalaryHistoryResponse(**cached_data)

        raw_response = await self._make_request("history", params)

        if raw_response and "month" in raw_response:
            month_dict = raw_response.get("month", {})
            history_points = []
            # Note: sort keys as YYYY-MM per Adzuna documentation guidelines
            for month_key in sorted(month_dict.keys()):
                val = month_dict[month_key]
                if val is not None:
                    history_points.append(
                        SalaryHistoryPoint(
                            period=month_key,
                            average_salary=round(float(val), 2),
                        )
                    )

            # Trend direction calculation
            trend = "stable"
            if len(history_points) >= 2:
                first_val = history_points[0].average_salary
                last_val = history_points[-1].average_salary
                pct_change = (last_val - first_val) / max(first_val, 1) * 100
                if pct_change > 3.0:
                    trend = "upward"
                elif pct_change < -3.0:
                    trend = "downward"

            resp = SalaryHistoryResponse(
                location=locations[-1] if locations else "Maharashtra",
                category=category,
                what=what,
                history=history_points,
                trend_direction=trend,
                data_source="adzuna",
                demand_granularity="district_or_state",
                cached=False,
            )
            await cache_service.set(cache_key, resp.model_dump(), ttl_seconds=self.cache_ttl)
            return resp

        # Fallback simulation
        return self._generate_simulated_salary_history(locations[-1] if locations else "Maharashtra", category, what)

    # =========================================================================
    # 4. Histogram data — /jobs/{country}/histogram
    # =========================================================================
    async def get_salary_histogram(
        self,
        what: str | None = None,
        locations: list[str] | None = None,
    ) -> SalaryHistogramResponse:
        """Current salary distribution bands for role and location."""
        locations = locations or ["India", "Maharashtra"]
        params: dict[str, Any] = {"what": what}
        for i, loc in enumerate(locations):
            params[f"location{i}"] = loc

        cache_key = self._build_cache_key("histogram", params)
        cached_data = await cache_service.get(cache_key)
        if cached_data:
            cached_data["cached"] = True
            return SalaryHistogramResponse(**cached_data)

        raw_response = await self._make_request("histogram", params)

        if raw_response and "histogram" in raw_response:
            hist_dict = raw_response.get("histogram", {})
            sorted_keys = sorted([int(k) for k in hist_dict.keys() if str(k).isdigit()])
            bands = []
            total_vacancies = 0

            for i, low_bound in enumerate(sorted_keys):
                count = int(hist_dict.get(str(low_bound), 0))
                total_vacancies += count
                high_bound = sorted_keys[i + 1] if i + 1 < len(sorted_keys) else None
                label = f"₹{low_bound // 1000}k - ₹{high_bound // 1000}k" if high_bound else f"₹{low_bound // 1000}k+"
                bands.append(
                    SalaryHistogramBand(
                        min_salary=float(low_bound),
                        max_salary=float(high_bound) if high_bound else None,
                        count=count,
                        label=label,
                    )
                )

            resp = SalaryHistogramResponse(
                what=what,
                location=locations[-1] if locations else "Maharashtra",
                bands=bands,
                total_vacancies=total_vacancies,
                data_source="adzuna",
                cached=False,
            )
            await cache_service.set(cache_key, resp.model_dump(), ttl_seconds=self.cache_ttl)
            return resp

        # Fallback simulation
        return self._generate_simulated_salary_histogram(what, locations[-1] if locations else "Maharashtra")

    # =========================================================================
    # 5. Top companies — /jobs/{country}/top_companies
    # =========================================================================
    async def get_top_companies(
        self,
        what: str | None = None,
        where: str | None = None,
    ) -> TopCompaniesResponse:
        """Top 5 hiring employers for a query and district."""
        params = {"what": what, "where": where}
        cache_key = self._build_cache_key("top_companies", params)
        cached_data = await cache_service.get(cache_key)
        if cached_data:
            cached_data["cached"] = True
            return TopCompaniesResponse(**cached_data)

        raw_response = await self._make_request("top_companies", params)

        if raw_response and "leaderboard" in raw_response:
            leaderboard = []
            for item in raw_response.get("leaderboard", []):
                leaderboard.append(
                    TopCompanyItem(
                        canonical_name=item.get("canonical_name", "Unknown Employer"),
                        count=item.get("count", 0),
                        average_salary=item.get("average_salary"),
                    )
                )

            resp = TopCompaniesResponse(
                what=what,
                where=where,
                leaderboard=leaderboard,
                data_source="adzuna",
                cached=False,
            )
            await cache_service.set(cache_key, resp.model_dump(), ttl_seconds=self.cache_ttl)
            return resp

        # Fallback simulation
        return self._generate_simulated_top_companies(what, where)

    # =========================================================================
    # 6. Categories — /jobs/{country}/categories
    # =========================================================================
    async def get_categories(self) -> JobCategoriesResponse:
        """Job categories taxonomy for mapping to SID sectors/occupations."""
        cache_key = "adzuna:categories:taxonomy"
        cached_data = await cache_service.get(cache_key)
        if cached_data:
            cached_data["cached"] = True
            return JobCategoriesResponse(**cached_data)

        raw_response = await self._make_request("categories", {})

        if raw_response and "results" in raw_response:
            categories = []
            for item in raw_response.get("results", []):
                categories.append(
                    JobCategoryItem(
                        label=item.get("label", ""),
                        tag=item.get("tag", ""),
                    )
                )

            resp = JobCategoriesResponse(
                categories=categories,
                data_source="adzuna",
                cached=False,
            )
            # Long cache TTL (24 hours) since categories are static taxonomy
            await cache_service.set(cache_key, resp.model_dump(), ttl_seconds=86400)
            return resp

        # Fallback taxonomy
        return self._generate_simulated_categories()

    # =========================================================================
    # 7. Jobsworth (salary predictor) — /jobs/{country}/jobsworth
    # =========================================================================
    async def predict_salary(
        self,
        title: str,
        description: str,
        district: str | None = None,
    ) -> SalaryPredictionResponse:
        """Predict salary given role title and skill description."""
        params = {"title": title, "description": description}
        cache_key = self._build_cache_key("jobsworth", params)
        cached_data = await cache_service.get(cache_key)
        if cached_data:
            cached_data["cached"] = True
            return SalaryPredictionResponse(**cached_data)

        raw_response = await self._make_request("jobsworth", params)

        if raw_response and "salary" in raw_response:
            predicted = float(raw_response.get("salary"))
            resp = SalaryPredictionResponse(
                title=title,
                predicted_salary=predicted,
                salary_range_low=round(predicted * 0.85, 2),
                salary_range_high=round(predicted * 1.25, 2),
                currency="INR",
                confidence=0.88,
                data_source="adzuna_jobsworth",
                cached=False,
            )
            await cache_service.set(cache_key, resp.model_dump(), ttl_seconds=self.cache_ttl)
            return resp

        # Fallback model estimate
        return self._generate_simulated_salary_prediction(title, description, district)

    # =========================================================================
    # 8. API Version & Health Check — /jobs/{country}/version
    # =========================================================================
    async def get_version(self) -> dict[str, Any]:
        """Check Adzuna API health and version."""
        raw_response = await self._make_request("version", {})
        if raw_response:
            return {
                "status": "connected",
                "api_version": raw_response.get("api_version", 1),
                "software_version": raw_response.get("software_version", "unknown"),
            }
        return {
            "status": "unconfigured" if not self.is_configured else "offline",
            "api_version": 1,
            "is_mock": True,
        }

    # =========================================================================
    # Fallback / Realistic Simulation Generators
    # =========================================================================
    def _generate_simulated_search_response(
        self,
        what: str | None,
        where: str | None,
        page: int,
        results_per_page: int,
    ) -> JobSearchResponse:
        """Realistic simulated job postings when API credentials are absent or during rate-limits."""
        target_role = what or "Technical Associate"
        target_location = where or "Pune, Maharashtra"

        mock_companies = [
            "Tata Motors Ltd", "Infosys Limited", "Bharat Forge", "Mahindra & Mahindra",
            "L&T Heavy Engineering", "Capgemini India", "Kirloskar Brothers", "Persistent Systems"
        ]

        results = []
        base_id = 100000 + (page * 20)
        for i in range(min(results_per_page, 15)):
            job_id = str(base_id + i)
            comp = mock_companies[i % len(mock_companies)]
            results.append(
                AdzunaJobItem(
                    id=job_id,
                    title=f"Senior {target_role}" if i % 2 == 0 else f"{target_role} Trainee",
                    description=f"Urgent requirement for skilled {target_role} in {target_location}. Requirements: hands-on expertise, quality compliance, and industry certifications.",
                    company=AdzunaCompany(display_name=comp),
                    location=AdzunaLocation(
                        area=["India", "Maharashtra", target_location.split(",")[0].strip()],
                        display_name=f"{target_location.split(',')[0].strip()}, Maharashtra",
                    ),
                    latitude=18.5204 if "pune" in target_location.lower() else 19.0760,
                    longitude=73.8567 if "pune" in target_location.lower() else 72.8777,
                    salary_min=float(240000 + (i * 25000)),
                    salary_max=float(480000 + (i * 35000)),
                    salary_is_predicted=1 if not self.is_configured else 0,
                    category=AdzunaCategory(label="Engineering & Technical", tag="engineering-jobs"),
                    contract_type="permanent",
                    contract_time="full_time",
                    created="2026-08-28T10:00:00Z",
                    redirect_url="https://www.adzuna.in",
                )
            )

        return JobSearchResponse(
            results=results,
            total_count=185,
            page=page,
            results_per_page=results_per_page,
            query_what=what,
            query_where=where,
            data_source="adzuna_simulated" if not self.is_configured else "adzuna_fallback",
            is_fallback=True,
            cached=False,
            warning="Live Adzuna credentials not configured; serving high-fidelity simulated market data." if not self.is_configured else "Adzuna rate limited; serving cached fallback.",
        )

    def _generate_simulated_geodata(self, locations: list[str]) -> GeodataResponse:
        """Simulated district-level geodata for Maharashtra."""
        mh_districts = [
            ("Pune", 18450),
            ("Mumbai", 24320),
            ("Thane", 11200),
            ("Nagpur", 8740),
            ("Nashik", 6890),
            ("Chhatrapati Sambhajinagar", 5430),
            ("Kolhapur", 3980),
            ("Solapur", 3210),
            ("Amravati", 2450),
            ("Satara", 2180),
        ]
        items = [
            GeodataLocationItem(
                count=cnt,
                location=AdzunaLocation(
                    area=["India", "Maharashtra", dist],
                    display_name=f"{dist}, Maharashtra",
                ),
            )
            for dist, cnt in mh_districts
        ]
        return GeodataResponse(
            locations=items,
            level=len(locations),
            parent_location="Maharashtra",
            data_source="adzuna_simulated",
            cached=False,
            has_district_depth=True,
        )

    def _generate_simulated_salary_history(
        self,
        location: str,
        category: str | None,
        what: str | None,
    ) -> SalaryHistoryResponse:
        """Simulated salary time-series trend for Maharashtra."""
        base_salary = 385000.0
        months = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"]
        points = []
        for i, m in enumerate(months):
            val = base_salary + (i * 7500.0) + (1200.0 if i % 2 == 0 else -800.0)
            points.append(SalaryHistoryPoint(period=m, average_salary=round(val, 2)))

        return SalaryHistoryResponse(
            location=location,
            category=category,
            what=what,
            history=points,
            trend_direction="upward",
            data_source="adzuna_simulated",
            demand_granularity="district_or_state",
            cached=False,
        )

    def _generate_simulated_salary_histogram(
        self,
        what: str | None,
        location: str,
    ) -> SalaryHistogramResponse:
        """Simulated salary distribution histogram."""
        bands = [
            SalaryHistogramBand(min_salary=150000, max_salary=250000, count=42, label="₹1.5L - ₹2.5L"),
            SalaryHistogramBand(min_salary=250000, max_salary=400000, count=118, label="₹2.5L - ₹4.0L"),
            SalaryHistogramBand(min_salary=400000, max_salary=600000, count=164, label="₹4.0L - ₹6.0L"),
            SalaryHistogramBand(min_salary=600000, max_salary=900000, count=85, label="₹6.0L - ₹9.0L"),
            SalaryHistogramBand(min_salary=900000, max_salary=None, count=31, label="₹9.0L+"),
        ]
        return SalaryHistogramResponse(
            what=what,
            location=location,
            bands=bands,
            total_vacancies=sum(b.count for b in bands),
            median_salary_estimate=475000.0,
            data_source="adzuna_simulated",
            cached=False,
        )

    def _generate_simulated_top_companies(
        self,
        what: str | None,
        where: str | None,
    ) -> TopCompaniesResponse:
        """Simulated top 5 hiring employers for Maharashtra."""
        loc = (where or "").lower()
        if "pune" in loc:
            employers = [
                TopCompanyItem(canonical_name="Tata Motors", count=142, average_salary=520000),
                TopCompanyItem(canonical_name="Infosys Pune", count=128, average_salary=610000),
                TopCompanyItem(canonical_name="Bharat Forge", count=94, average_salary=480000),
                TopCompanyItem(canonical_name="Bajaj Auto", count=76, average_salary=540000),
                TopCompanyItem(canonical_name="Persistent Systems", count=65, average_salary=630000),
            ]
        elif "nagpur" in loc:
            employers = [
                TopCompanyItem(canonical_name="TCS MIHAN", count=84, average_salary=490000),
                TopCompanyItem(canonical_name="Mahindra Logistics", count=62, average_salary=380000),
                TopCompanyItem(canonical_name="Adani Power Vidarbha", count=45, average_salary=440000),
                TopCompanyItem(canonical_name="Solar Industries India", count=39, average_salary=410000),
                TopCompanyItem(canonical_name="Ceat Tyres Butibori", count=34, average_salary=360000),
            ]
        else:
            employers = [
                TopCompanyItem(canonical_name="Reliance Industries", count=210, average_salary=580000),
                TopCompanyItem(canonical_name="Tata Consultancy Services", count=195, average_salary=620000),
                TopCompanyItem(canonical_name="Larsen & Toubro", count=140, average_salary=560000),
                TopCompanyItem(canonical_name="Mahindra & Mahindra", count=115, average_salary=510000),
                TopCompanyItem(canonical_name="State Bank of India", count=98, average_salary=470000),
            ]

        return TopCompaniesResponse(
            what=what,
            where=where,
            leaderboard=employers,
            data_source="adzuna_simulated",
            cached=False,
        )

    def _generate_simulated_categories(self) -> JobCategoriesResponse:
        """Standard Adzuna categories taxonomy."""
        cats = [
            JobCategoryItem(label="IT & Software Jobs", tag="it-jobs"),
            JobCategoryItem(label="Engineering Jobs", tag="engineering-jobs"),
            JobCategoryItem(label="Manufacturing Jobs", tag="manufacturing-jobs"),
            JobCategoryItem(label="Automotive Jobs", tag="automotive-jobs"),
            JobCategoryItem(label="Healthcare & Nursing Jobs", tag="healthcare-nursing-jobs"),
            JobCategoryItem(label="Logistics & Warehouse Jobs", tag="logistics-warehouse-jobs"),
            JobCategoryItem(label="Accounting & Finance Jobs", tag="accounting-finance-jobs"),
            JobCategoryItem(label="Sales & Retail Jobs", tag="sales-jobs"),
            JobCategoryItem(label="Energy & Utilities Jobs", tag="energy-jobs"),
            JobCategoryItem(label="Hospitality & Catering Jobs", tag="hospitality-catering-jobs"),
        ]
        return JobCategoriesResponse(categories=cats, data_source="adzuna_simulated", cached=False)

    def _generate_simulated_salary_prediction(
        self,
        title: str,
        description: str,
        district: str | None,
    ) -> SalaryPredictionResponse:
        """Simulated salary prediction estimate based on role complexity."""
        title_lower = title.lower()
        base_salary = 360000.0

        if any(w in title_lower for w in ["ai", "machine learning", "data scientist", "cloud", "devops"]):
            base_salary = 750000.0
        elif any(w in title_lower for w in ["developer", "software", "engineer", "full stack"]):
            base_salary = 580000.0
        elif any(w in title_lower for w in ["electrician", "technician", "cnc", "welder", "operator"]):
            base_salary = 320000.0
        elif any(w in title_lower for w in ["manager", "lead", "architect", "head"]):
            base_salary = 950000.0

        if district and "mumbai" in district.lower():
            base_salary *= 1.15
        elif district and "pune" in district.lower():
            base_salary *= 1.08

        return SalaryPredictionResponse(
            title=title,
            predicted_salary=round(base_salary, 2),
            salary_range_low=round(base_salary * 0.85, 2),
            salary_range_high=round(base_salary * 1.25, 2),
            currency="INR",
            confidence=0.86,
            data_source="adzuna_jobsworth_simulated",
            cached=False,
        )


adzuna_service = AdzunaService()
