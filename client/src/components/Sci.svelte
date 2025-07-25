<script>
    import {createEventDispatcher, onMount} from "svelte"
    import {sciMembers} from "../stores/member"
    import UIkit from "uikit"
    import {screenWidthL, screenWidthM, screenWidthS} from "../stores/navigation"
    import {settings} from "../stores/api"
    import SciForm from "./SciForm.svelte"

    let recreateForm = false
    let selectedMember

    const dispatch = createEventDispatcher()

    function dispatchReload() {
        dispatch('message', {
            reload: 'sci'
        })
    }

    function openForm(member) {
        selectedMember = member
        recreateForm = !recreateForm
        UIkit.modal("#modal-form").show()
    }

    async function processReplacement(event) {
        if (event.detail.goto !== undefined) {
            let success = false
            switch (event.detail.goto) {
                case 'save':
                    UIkit.modal("#modal-form").hide()
                    dispatchReload()
                    break
                case 'cancel':
                    UIkit.modal("#modal-form").hide()
                    break
            }
        }
    }
</script>

<div class="uk-flex uk-flex-center">
    <div class="uk-section uk-section-xsmall uk-margin-medium-top uk-margin-bottom uk-width-2-3@m uk-width-5-6">
        <h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom uk-width-1-1">SCI { $screenWidthS ? '' : 'member'} stats</h4>
        <div class="uk-margin-medium">
            {#if $sciMembers.length === 0}
                Loading SCI members...
            {:else }
                <table class="uk-table uk-table-striped uk-table-hover uk-table-small uk-text-small">
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th class="uk-visible@m">Email</th>
                        <th class="uk-table-shrink uk-text-nowrap">Free days left</th>
                        <th class="uk-visible@s uk-table-shrink uk-text-nowrap">Free days used</th>
                        <th>Replace</th>
                    </tr>
                    </thead>
                    <tbody>
                    {#each $sciMembers as member}
                        <tr>
                            <td>{member.name}</td>
                            <td class="uk-visible@m">{member.email}</td>
                            <td>{$settings.sci_days - member.sci_days_used}</td>
                            <td class="uk-visible@s">{member.sci_days_used}</td>
                            <td class="uk-table-shrink"><button on:click={() => openForm(member)} class="uk-button uk-button-small uk-button-default">Replace</button></td>
                        </tr>
                    {/each}
                    </tbody>
                </table>
            {/if}
        </div>
    </div>
</div>

<!-- SCI REPLACE MEMBER form modal -->

<div id="modal-form"
     class:uk-margin-auto-vertical={!$screenWidthM}
     class="uk-modal-full" uk-modal="esc-close: false; bg-close: false">

    <div class="uk-modal-dialog uk-overflow-auto uk-width-3-4@m">
        <button class="uk-modal-close-full uk-close-large" type="button" uk-close></button>
        <div class="uk-flex uk-flex-center">
            <div class="uk-padding-large uk-width-3-5@xl uk-width-2-3@l uk-width-5-6" uk-height-viewport>

                {#key recreateForm}
                    <SciForm bind:member={selectedMember} on:message={processReplacement} />
                {/key}
            </div>
        </div>
    </div>
</div>