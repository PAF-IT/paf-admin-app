<script>
    import {createEventDispatcher, onMount} from "svelte"
    import {
        createMember,
        getMemberByEmail,
        getMemberByName,
        getMembers,
        memberNames,
        updateMember
    } from "../stores/member"
    import InfiniteScroll from "svelte-infinite-scroll"
    import autoComplete from "@tarekraafat/autocomplete.js"
    import {DateTime} from "luxon"
    import MemberForm from "./MemberForm.svelte"
    import UIkit from "uikit";
    import MemberSignature from "./MemberSignature.svelte"
    import {screenWidthL, screenWidthM, screenWidthS} from "../stores/navigation"


    let page = 1
    let maxPage = 2
    let data = []
    let newBatch = []
    let selectedMember
    let editMember = false
    let renewMember = false
    let showSignPad = false
    let signatureBase64
    let recreateForm = false

    $: data = [...data, ...newBatch]

    const dispatch = createEventDispatcher()

    onMount(async ()=> {

        await fetchData()

        const autoCompleteJS = new autoComplete({
            selector: "#autocomplete",
            placeHolder: "Search members...",
            diacritics: true,
            searchEngine: 'strict',
            data: {
                src: $memberNames,
                cache: true,
            },
            resultsList: {
                element: (list, data) => {
                    if (!data.results.length) {
                        const message = document.createElement("div")
                        message.setAttribute("class", "no_result")
                        message.innerHTML = `<span>No Member for "${data.query}"</span>`
                        list.prepend(message)
                    }
                },
                maxResults: 50,
                noResults: true
            },
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        autoCompleteJS.input.value = event.detail.selection.value
                        fetchMember(event.detail.selection.value)
                    },
                    keyup: () => {
                        if (autoCompleteJS.input.value === '')
                            fetchMember(null)
                    }
                }
            }
        })
    })

    async function fetchData() {
        const response = await getMembers(page)
        maxPage = response.meta.last_page
        newBatch = await response.data
    }

    async function fetchMember(memberName) {
        if (memberName !== undefined && memberName !== null) {
            newBatch = []
            data = [... await getMemberByName(memberName)]
        } else if (data.length === 1) {
            data = []
            page = 1
            await fetchData()
        }
    }

    function dispatchReload() {
        dispatch('message', {
            reload: 'member'
        })
    }

    function openForm(member, renew) {
        selectedMember = member instanceof MouseEvent ? null : JSON.parse(JSON.stringify(member))
        renewMember = selectedMember !== null && renew
        editMember = selectedMember !== null && !renew
        showSignPad = false
        recreateForm = !recreateForm
        UIkit.modal("#modal-full").show()
    }

    async function processSignup(event) {
        if (event.detail.goto !== undefined) {
            switch (event.detail.goto) {
                case 'signature':
                    showSignPad = true
                    recreateForm = !recreateForm
                    break
                case 'form':
                    showSignPad = false
                    recreateForm = !recreateForm
                    break
                case 'jumpEdit':
                    let membemail = await getMemberByEmail(event.detail.email)
                    UIkit.modal("#modal-full").hide()
                    openForm(membemail, DateTime.fromSQL(membemail.renew_date) < DateTime.now())
                    break
                case 'cancel':
                    UIkit.modal("#modal-full").hide()
            }
            return
        }

        let member = selectedMember
        let success = false

        if (event.detail.signature !== undefined) {
            member.signature = event.detail.signature
        }
        if (!editMember && !renewMember)
            success = await createMember(member)
        else if (member.id !== undefined && member.id !== null)
            success = await updateMember(member)

        if (success) {
            UIkit.modal("#modal-full").hide()
            UIkit.notification('<span uk-icon="icon: check"></span> Successfully ' + (event.detail.signature !== undefined && !renewMember ? 'created!' : renewMember ? 'renewed!' : 'updated!'), {status:'success', pos: 'bottom-center'});
        } else {
            UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {status: 'danger', pos: 'bottom-center'});
        }

        dispatchReload()
    }
</script>

<div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6 paf-top-section-bg">
        <div class="uk-flex uk-flex-center">
            <input class="uk-input {$screenWidthS ? 'uk-width-small' : ($screenWidthM || $screenWidthL) ? 'uk-width-medium' : 'uk-width-large'}" id="autocomplete" type="search" spellcheck=false autocorrect="off" autocomplete="off" autocapitalize="off" maxlength="256">
            <button on:click={openForm} class="uk-button uk-button-small uk-button-primary uk-margin-large-left"><span uk-icon="icon: plus; ratio: 0.6"></span>{$screenWidthS? '' : $screenWidthM ? '\xa0member' : '\xa0New member'}</button>
        </div>
    </div>
</div>

<div class="uk-flex uk-flex-center" style="max-height: 75%; overflow-x: scroll;">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6">
        {#if data.length === 0}
            Loading members...
        {:else }
            <table class="uk-table uk-table-striped uk-table-hover uk-table-small uk-text-small">
                <thead>
                <tr>
                    <th>Name</th>
                    <th class="uk-visible@s">Email</th>
                    <th class="uk-visible@l">City</th>
                    <th class="uk-text-nowrap">Valid until &nbsp;</th>
                </tr>
                </thead>
                <tbody>
                {#each data as member}
                    {#if DateTime.fromSQL(member.renew_date) < DateTime.now()}
                        <tr on:click={() => openForm(member, true)} class="uk-text-danger">
                            <td>{member.name}</td>
                            <td class="uk-visible@s">{member.email}</td>
                            <td class="uk-visible@l">{member.city}</td>
                            <td class="uk-text-bold">{member.renew_date}</td>
                        </tr>
                    {:else}
                        <tr on:click={() => openForm(member, false)} class="uk-table-link">
                            <td>{member.name}</td>
                            <td class="uk-visible@s">{member.email}</td>
                            <td class="uk-visible@l">{member.city}</td>
                            <td class="uk-table-shrink uk-text-nowrap">{DateTime.fromSQL(member.renew_date).toFormat('dd LLL yyyy')}</td>
                        </tr>
                    {/if}
                {/each}
                </tbody>
            </table>
        {/if}
    </div>
    <InfiniteScroll hasMore={newBatch.length} threshold={80} on:loadMore={() => {
        if (page < maxPage) {
            page++
            fetchData()
        }
    }} />
</div>

<!-- MEMBER form modal -->

<div id="modal-full"
     class:uk-margin-auto-vertical={!$screenWidthM}
     class="uk-modal-full" uk-modal="esc-close: false; bg-close: false">

    <div class="uk-modal-dialog uk-overflow-auto uk-width-3-4@m">
        <button class="uk-modal-close-full uk-close-large" type="button" uk-close></button>
        <div class="uk-flex uk-flex-center">
            <div class="uk-padding-large uk-width-3-5@xl uk-width-2-3@l uk-width-5-6" uk-height-viewport>

                {#if !showSignPad}
                    {#key recreateForm}
                        <MemberForm bind:member={selectedMember} renew={renewMember} on:message={processSignup} />
                    {/key}
                {:else}
                    {#key recreateForm}
                        <MemberSignature edit={editMember} renew={renewMember} on:message={processSignup} />
                    {/key}
                {/if}
            </div>
        </div>
    </div>
</div>