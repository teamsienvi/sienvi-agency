import sys

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Patch PDF generation
    pdf_target = "} else if (questionnaire.concise_version || !questionnaire.completed_at) {"
    pdf_replacement = """      } else if (questionnaire.seo_aeo_version) {
        let seoHtml = "";
        
        let intent = "";
        intent += renderPrintField("Business Outcome", questionnaire.businessOutcome);
        intent += renderPrintField("Prioritize Products", questionnaire.prioritizeProducts);
        intent += renderPrintField("Ideal Customer Search", questionnaire.idealCustomerSearch);
        intent += renderPrintField("Prospects Search Comparing", questionnaire.prospectsSearchComparing);
        intent += renderPrintField("Prospects Search Ready To Buy", questionnaire.prospectsSearchReadyToBuy);
        seoHtml += renderPrintCard("1. Business Goals & Search Intent", intent);

        let conversion = "";
        conversion += renderPrintField("Questions Before Lead", questionnaire.questionsBeforeLead);
        conversion += renderPrintField("Objections To Stop", questionnaire.objectionsToStop);
        conversion += renderPrintField("Pages Generate Leads", questionnaire.pagesGenerateLeads);
        conversion += renderPrintField("Pages Should Generate", questionnaire.pagesShouldGenerate);
        conversion += renderPrintField("Valuable Keywords", questionnaire.valuableKeywords);
        seoHtml += renderPrintCard("2. Conversion & Existing Organic Performance", conversion);

        let positioning = "";
        positioning += renderPrintField("Avoid Keywords", questionnaire.avoidKeywords);
        positioning += renderPrintField("Top Search Competitors", questionnaire.topSearchCompetitors);
        positioning += renderPrintField("Differentiator", questionnaire.differentiator);
        positioning += renderPrintField("Proof For Pages", questionnaire.proofForPages);
        positioning += renderPrintField("Exact Questions To Answer", questionnaire.exactQuestionsToAnswer);
        positioning += renderPrintField("Claims To Avoid", questionnaire.claimsToAvoid);
        seoHtml += renderPrintCard("3. Positioning, Proof & Answer Engine Visibility", positioning);

        let access = "";
        access += renderPrintField("Current Access", questionnaire.currentAccess);
        access += renderPrintField("Local SEO Priorities", questionnaire.localSeoPriorities);
        access += renderPrintField("Organic Actions Conversions", questionnaire.organicActionsConversions);
        access += renderPrintField("Assets Team Can Provide", questionnaire.assetsTeamCanProvide);
        seoHtml += renderPrintCard("4. Access, Local SEO, Measurement & Monthly Inputs", access);

        reportContent += `
          <div class="section-title page-break">SEO/AEO-Specific Discovery Questionnaire</div>
          ${seoHtml}
        `;
      } else if (questionnaire.concise_version || !questionnaire.completed_at) {"""

    # 3. Patch UI Rendering
    ui_target = ") : (questionnaire.concise_version || !questionnaire.completed_at) ? ("
    ui_replacement = """) : questionnaire.seo_aeo_version ? (
                  <>
                    <Card>
                      <CardHeader><CardTitle className="text-base">1. Business Goals & Search Intent</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Business Outcome", questionnaire.businessOutcome)}
                        {renderField("Prioritize Products", questionnaire.prioritizeProducts)}
                        {renderField("Ideal Customer Search", questionnaire.idealCustomerSearch)}
                        {renderField("Prospects Search Comparing", questionnaire.prospectsSearchComparing)}
                        {renderField("Prospects Search Ready To Buy", questionnaire.prospectsSearchReadyToBuy)}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-base">2. Conversion & Existing Organic Performance</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Questions Before Lead", questionnaire.questionsBeforeLead)}
                        {renderField("Objections To Stop", questionnaire.objectionsToStop)}
                        {renderField("Pages Generate Leads", questionnaire.pagesGenerateLeads)}
                        {renderField("Pages Should Generate", questionnaire.pagesShouldGenerate)}
                        {renderField("Valuable Keywords", questionnaire.valuableKeywords)}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-base">3. Positioning, Proof & Answer Engine Visibility</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Avoid Keywords", questionnaire.avoidKeywords)}
                        {renderField("Top Search Competitors", questionnaire.topSearchCompetitors)}
                        {renderField("Differentiator", questionnaire.differentiator)}
                        {renderField("Proof For Pages", questionnaire.proofForPages)}
                        {renderField("Exact Questions To Answer", questionnaire.exactQuestionsToAnswer)}
                        {renderField("Claims To Avoid", questionnaire.claimsToAvoid)}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-base">4. Access, Local SEO, Measurement & Monthly Inputs</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Current Access", questionnaire.currentAccess)}
                        {renderField("Local SEO Priorities", questionnaire.localSeoPriorities)}
                        {renderField("Organic Actions Conversions", questionnaire.organicActionsConversions)}
                        {renderField("Assets Team Can Provide", questionnaire.assetsTeamCanProvide)}
                      </CardContent>
                    </Card>
                  </>
                ) : (questionnaire.concise_version || !questionnaire.completed_at) ? ("""

    content = content.replace(pdf_target, pdf_replacement)
    content = content.replace(ui_target, ui_replacement)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

patch_file('src/components/admin/OnboardingResponsesModal.tsx')
