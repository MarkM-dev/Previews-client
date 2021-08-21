import os
import sys
from distutils.dir_util import copy_tree
import shutil
import json

def get_version():
    manifest_path = 'temp/manifest.json'

    with open(manifest_path, 'r') as f:
        data = json.load(f)
        return data['version'].replace('.', '')


def replace_strings_for_opera():
    background_path = 'temp/main/background.js'

    with open(background_path, 'r') as f:
        data = f.read()
        data = data.replace('https://chrome.google.com/webstore/detail/twitch-previews/hpmbiinljekjjcjgijnlbmgcmoonclah/reviews/', 'https://addons.opera.com/en/extensions/details/twitch-previews/')
        data = data.replace('https://chrome.google.com/webstore/detail/twitch-previews/hpmbiinljekjjcjgijnlbmgcmoonclah/', 'https://addons.opera.com/en/extensions/details/twitch-previews/')

    with open(os.path.join(os.path.dirname(__file__), background_path), 'w') as f:
        f.write(data)


def replace_strings_for_firefox():
    manifest_path = 'temp/manifest.json'
    background_path = 'temp/main/background.js'

    with open(manifest_path, 'r') as f:
        data = f.read()
        data = data.replace(',"content_security_policy": "script-src \'self\' https://www.google-analytics.com; object-src \'self\'"', '')

    with open(manifest_path, 'w') as f:
        f.write(data)

    with open(background_path, 'r') as f:
        data = f.read()


        data = data.replace('''(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){\n''' \
                            '''    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),\n''' \
                            '''    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)\n''' \
                            '''})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');\n''' \
                            '''ga('create', 'UA-134155755-2', 'auto');\n''' \
                            '''ga('set', 'checkProtocolTask', null);\n''' \
                            '''ga('send', 'pageview', 'main');''', '') \

        data = data.replace('''ga('send', 'event', category, action, value);''', '')

    with open(background_path, 'w') as f:
        f.write(data)


def build(browser):
    os.mkdir('temp')
    copy_tree('../Twitch-Previews', 'temp')

    if browser == 'chrome':
        pass
    elif browser == 'firefox':
        replace_strings_for_firefox()
    elif browser == 'opera':
        replace_strings_for_opera()

    output_filename = 'TwitchPreviewsV' + get_version() + '-' + browser
    shutil.make_archive(output_filename, 'zip', 'temp')
    shutil.rmtree('temp')


if len(sys.argv) > 1:
    build(sys.argv[1])
