# Software Requirements Specification (SRS)

# AI-Powered Labour Market Intelligence & Curriculum Alignment Platform

**Version:** 1.0\
**Document Type:** Software Requirements Specification

------------------------------------------------------------------------

# 1. Introduction

## 1.1 Problem Statement

Traditional skill-development programmes often rely on historical
occupation classifications and periodic curriculum updates. Due to
rapidly changing technologies, industry requirements, and local
employment patterns, training programmes may become outdated.

This creates a mismatch between: - Skills taught by training
institutions - Skills demanded by employers - Career expectations of
candidates - Future industry requirements

The proposed system creates a continuous evidence-based labour
intelligence platform that converts real-world market signals into
actionable decisions for curriculum design, training capacity planning,
and candidate guidance.

------------------------------------------------------------------------

# 2. Vision of the System

The platform acts as a national-level intelligence layer connecting:

Industry Demand → AI Skill Intelligence → Curriculum Recommendations →
Training Implementation → Employment Outcomes → Continuous Improvement

------------------------------------------------------------------------

# 3. Objectives

## 3.1 Identify Real-Time Skill Demand

The system analyzes: - Job postings - Employer requirements - Industry
consultations - Sector growth trends - Emerging technologies - Placement
outcomes

to identify: - High-demand roles - Required skills - Location-based
demand - Required proficiency levels

## 3.2 Detect Skill Gaps

The platform compares:

Industry Required Skills vs Existing Course Curriculum

and identifies: - Missing skills - Outdated topics - Oversupplied
courses - Emerging requirements

## 3.3 Recommend Curriculum Improvements

The system provides evidence-backed recommendations:

-   Add new modules
-   Remove obsolete topics
-   Modify course duration
-   Improve practical training

## 3.4 Improve Training Capacity Planning

The system evaluates: - Trainer availability - Trainer expertise -
Equipment availability - Infrastructure requirements

## 3.5 Generate District-Level Training Plans

The system converts demand insights into local execution plans using: -
Regional demand - Existing institutes - Infrastructure - Candidate
availability

## 3.6 Provide Career Guidance

The platform recommends: - Career paths - Required skills - Courses -
Future opportunities

------------------------------------------------------------------------

# 4. System Stakeholders

## Government Authorities (Primary Users)

Responsibilities: - Review AI recommendations - Approve curriculum
changes - Plan district training programmes

## Employers

Responsibilities: - Provide skill requirements - Validate curriculum
relevance - Give placement feedback

## Training Institutes

Responsibilities: - Provide trainer information - Report infrastructure
capacity - Implement updated courses

## Candidates / Students

Responsibilities: - Receive career recommendations - Follow learning
pathways - Provide feedback

------------------------------------------------------------------------

# 5. Functional Requirements

# Module 1: Labour Market Data Collection System

Collects information from:

-   Job portals
-   Company career pages
-   Government employment databases
-   Employer surveys
-   Industry reports
-   Placement records

Extracts: - Job roles - Skills - Locations - Salary trends - Experience
requirements

------------------------------------------------------------------------

# Module 2: Skill Intelligence Engine

Maintains a Skill Ontology / Skill Graph:

Job Role → Required Skills → Proficiency Level → Courses → Career Path

Example:

EV Technician: - Battery Management - Electrical Diagnostics - Safety
Protocols

Mapped Courses: - EV Maintenance Certification

------------------------------------------------------------------------

# Module 3: AI Skill Gap Analyzer

Identifies mismatch between:

Industry Requirements vs Existing Curriculum

Outputs: - Missing skills - Outdated content - Priority areas

------------------------------------------------------------------------

# Module 4: Curriculum Recommendation Engine

Generates recommendations containing:

-   Suggested changes
-   Evidence
-   Demand statistics
-   Industry validation
-   Expected impact

------------------------------------------------------------------------

# Module 5: Employer Validation System

Workflow:

AI Recommendation\
↓\
Industry Expert Review\
↓\
Government Approval\
↓\
Curriculum Update

------------------------------------------------------------------------

# Module 6: Training Capacity Planner

Evaluates:

## Trainers

-   Number of trainers
-   Skill expertise
-   Upskilling requirements

## Infrastructure

-   Equipment availability
-   Labs
-   Budget requirements

------------------------------------------------------------------------

# Module 7: District Planning Engine

Creates localized training strategies based on:

-   Regional demand
-   Existing centres
-   Infrastructure
-   Candidate population

------------------------------------------------------------------------

# Module 8: Feedback Learning System

Creates continuous improvement:

Prediction → Training → Employment Outcome → Model Improvement

Feedback sources: - Placement rates - Employer satisfaction - Candidate
success - Course performance

------------------------------------------------------------------------

# 6. Non-Functional Requirements

## Scalability

Support: - Multiple states - Millions of candidates - Thousands of
courses

## Reliability

Provide: - Data consistency - Handling of missing data - Explainable
recommendations

## Security

Provide: - Role-based authentication - Privacy protection - Secure
access control

## Explainability

Every AI recommendation must explain:

Why was this recommendation generated?

Example:

Skill added because: - Appeared in thousands of job postings - Shows
increasing market demand

------------------------------------------------------------------------

# 7. High-Level System Architecture

Data Sources:

Job Posts\
Employer Data\
Industry Reports\
Placement Data\
Technology Trends

↓

Data Processing Layer

↓

AI Intelligence Platform:

-   Skill Extraction Engine
-   Demand Forecasting Model
-   Skill Gap Analyzer
-   Recommendation Engine
-   Capacity Planner

↓

Human Validation:

-   Employers
-   Government Experts

↓

Implementation:

-   Updated Courses
-   Training Plans
-   Career Guidance

↓

Feedback Loop

------------------------------------------------------------------------

# 8. MVP Scope

## Phase 1

Build: - Job data ingestion - NLP skill extraction - Skill ontology -
Skill gap analysis - Curriculum recommendation dashboard

## Phase 2

Add: - Employer validation - Training capacity planning - District
planning

## Phase 3

Add: - Candidate career assistant - Advanced forecasting - Automated
curriculum evolution

------------------------------------------------------------------------

# 9. Success Metrics

## Employment Metrics

-   Increased placement rates
-   Reduced time-to-placement

## Curriculum Metrics

-   Faster curriculum updates
-   Reduced outdated courses

## Industry Metrics

-   Improved employer satisfaction
-   Reduced skill mismatch

## Government Metrics

-   Better resource allocation
-   Data-driven decisions

------------------------------------------------------------------------

# Product Summary

The platform is a closed-loop AI decision system that continuously
observes the labour market, understands skill evolution, recommends
curriculum changes, validates decisions with industry, enables training
implementation, and learns from employment outcomes.
