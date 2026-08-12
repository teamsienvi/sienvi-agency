import sys

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix TabsList grid-cols
    target_grid = 'className={`grid w-full h-auto ${onboardingType === "amazon" || onboardingType === "discovery" || onboardingType === "prospect" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-0"}`}'
    replace_grid = 'className={`grid w-full h-auto ${onboardingType === "amazon" ? "grid-cols-1" : (onboardingType === "discovery" || onboardingType === "prospect") ? (clientEmail === "sam@hairtamin.com" ? "grid-cols-2 gap-2" : "grid-cols-1") : "grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-0"}`}'
    content = content.replace(target_grid, replace_grid)

    # Fix TabsTrigger
    target_trigger = """) : (onboardingType === "discovery" || onboardingType === "prospect") ? (
                <TabsTrigger value="questionnaire" className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  {onboardingType === "prospect" ? (clientPlan === "prospect" ? "Prospect Discovery Onboarding" : "General Discovery Onboarding") : "Business Admin Onboarding"}
                  {renderStatus(questionnaire)}
                </TabsTrigger>
              ) : ("""
    replace_trigger = """) : (onboardingType === "discovery" || onboardingType === "prospect") ? (
                <>
                  <TabsTrigger value="questionnaire" className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    {onboardingType === "prospect" ? (clientPlan === "prospect" ? "Prospect Discovery Onboarding" : "General Discovery Onboarding") : "Business Admin Onboarding"}
                    {renderStatus(questionnaire)}
                  </TabsTrigger>
                  {clientEmail === "sam@hairtamin.com" && (
                    <TabsTrigger value="seo_aeo" className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      SEO/AEO Discovery Questionnaire
                      {renderStatus(questionnaire)}
                    </TabsTrigger>
                  )}
                </>
              ) : ("""
    content = content.replace(target_trigger, replace_trigger)

    # Fix TabsContent for questionnaire and seo_aeo
    target_content = """) : (questionnaire.seo_aeo_version || clientEmail === "sam@hairtamin.com") ? (
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
    
    replace_content = """) : (questionnaire.concise_version || !questionnaire.completed_at) ? ("""

    content = content.replace(target_content, replace_content)

    # Now add the <TabsContent value="seo_aeo"> section
    target_end_tabs_content = """                  )}
                </TabsContent>"""
    replace_end_tabs_content = """                  )}
                </TabsContent>
                
                {clientEmail === "sam@hairtamin.com" && (
                  <TabsContent value="seo_aeo" className="space-y-4">
                    {!questionnaire ? (
                      <Card><CardContent className="py-8 text-center text-muted-foreground">No SEO/AEO questionnaire submitted yet</CardContent></Card>
                    ) : (
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
                    )}
                  </TabsContent>
                )}"""
    
    # We must only replace the first occurrence of target_end_tabs_content that corresponds to the questionnaire tab
    # Wait, target_end_tabs_content occurs multiple times. Let's find exactly the one for questionnaire.
    # The questionnaire tab ends with `)} </TabsContent>` but let's be more specific.
    target_end_tabs_content = """                ) : (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">Standard onboarding not found or still in progress</CardContent></Card>
                )}
              </TabsContent>"""
    replace_end_tabs_content = """                ) : (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">Standard onboarding not found or still in progress</CardContent></Card>
                )}
              </TabsContent>
              
              {clientEmail === "sam@hairtamin.com" && (
                <TabsContent value="seo_aeo" className="space-y-4">
                  {!questionnaire ? (
                    <Card><CardContent className="py-8 text-center text-muted-foreground">No SEO/AEO questionnaire submitted yet</CardContent></Card>
                  ) : (
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
                  )}
                </TabsContent>
              )}"""

    content = content.replace(target_end_tabs_content, replace_end_tabs_content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

patch_file('src/components/admin/OnboardingResponsesModal.tsx')
